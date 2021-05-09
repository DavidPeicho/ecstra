import { Entity } from './entity.js';
import {
  ComponentManager,
  ComponentRegisterOptions
} from './internals/component-manager.js';
import { QueryManager } from './internals/query-manager.js';
import { SystemManager } from './internals/system-manager.js';
import { System } from './system.js';
import { SystemGroup } from './system-group.js';
import { Component } from './component.js';
import { Query, QueryComponents } from './query.js';
import { DefaultPool, ObjectPool } from './pool/pool.js';
import {
  ComponentClass,
  ComponentOf,
  Constructor,
  EntityOf,
  EntityClass,
  Nullable,
  Option,
  PropertiesOf,
  SystemClass,
  SystemGroupClass
} from './types';
import { Archetype } from './internals/archetype.js';
import { CommandBuffer } from './command-buffer.js';

/**
 * The world is the link between entities and systems. The world is composed
 * of system instances that execute logic on entities with selected components.
 *
 * An application can have as many worlds as needed. However, always remember
 * that entities and components instances are bound to the world that create
 * them.
 *
 * ## Creation
 *
 * It's possible to create a world using:
 *
 * ```js
 * const world = new World();
 * ```
 *
 * You can also change the default behaviour of the world using:
 *
 * ```js
 * const world = new World({
 *   systems: ...,
 *   components: ...,
 *   maxComponentType: ...,
 *   useManualPooling: ...,
 *   EntityClass: ...
 * });
 * ```
 *
 * For more information about the options, please have a look a the
 * [[WorldOptions]] interface
 *
 * ## Creating Entities
 *
 * Entities should **only** be created using:
 *
 * ```js
 * const entity = world.create('myBeautifulEntity');
 * ```
 *
 * @category world
 */
export class World<E extends Entity = Entity> {
  /** @hidden */
  protected readonly _components: ComponentManager<this>;

  /** @hidden */
  protected readonly _queries: QueryManager<this>;

  /** @hidden */
  protected readonly _systems: SystemManager<this>;

  /** @hidden */
  protected readonly _EntityClass: EntityClass<EntityOf<this>>;

  /** @hidden */
  protected _entityPool: Nullable<EntityPool<this>>;

  /** @hidden */
  protected readonly _postExecuteCmdBuffer: CommandBuffer;

  /** Public API. */

  public constructor(options: Partial<WorldOptions<E>> = {}) {
    const {
      maxComponentType = 256,
      useManualPooling = false,
      EntityClass = Entity,
      EntityPoolClass = DefaultPool,
      ComponentPoolClass = DefaultPool,
      systems = [],
      components = []
    } = options;
    this._queries = new QueryManager(this);
    this._systems = new SystemManager(this);
    this._components = new ComponentManager(this, {
      maxComponentType,
      ComponentPoolClass: useManualPooling ? null : ComponentPoolClass
    });
    this._EntityClass = EntityClass as EntityClass<EntityOf<this>>;

    this._entityPool = null;
    if (useManualPooling) {
      this._entityPool = new EntityPoolClass(
        this._EntityClass
      ) as EntityPool<this>;
    }

    this._postExecuteCmdBuffer  = new CommandBuffer();

    for (const component of components) {
      this.registerComponent(component);
    }
    for (const system of systems) {
      this.register(system as SystemClass<System<this>>);
    }
  }

  /**
   * Registers a system in this world instance
   *
   * **Note**: only one instance per system class can be registered
   *
   * @param Class - Class of the system to register
   * @param opts - Options forwarded to the constructor of the system
   *
   * @return This instance
   */
  public register<T extends System<this>>(
    Class: SystemClass<T>,
    opts?: SystemRegisterOptions<this>
  ): this {
    this._systems.register(Class, opts);
    return this;
  }

  /**
   * Unregisters the system from this world instance
   *
   * ## Notes
   *
   *   * Deletes the system and frees its queries if they aren't used by any
   *     other systems
   *   * Deletes the group in which the system was if the group is now empty
   *
   * @param Class - Class of the system to unregister
   *
   * @return This instance
   */
  public unregister<T extends System<this>>(Class: SystemClass<T>): this {
    this._systems.unregister(Class);
    return this;
  }

  /**
   * Registers a component type in this world instance.
   *
   * ## Notes
   *
   * It's not mandatory to pre-register a component this way. However, it's
   * always better to pre-allocate and initialize everything you can on startup
   * for optimal performance at runtime.
   *
   * Registering a component manually will avoid registration on first usage
   * and can thus optimize your runtime performance.
   *
   * @param Class - Class of the component to register
   * @param opts - Set of options to affect the component registration, such
   *   as the pool used
   *
   * @return This instance
   */
  public registerComponent<T extends Component>(
    Class: ComponentClass<T>,
    opts?: ComponentRegisterOptions
  ): this {
    this._components.registerComponentManual(Class, opts);
    return this;
  }

  /**
   * Creates a new entity
   *
   * @param name - Optional name of the entity. The name isn't a read-only
   *   property and can be changed later
   *
   * @return The entity instance
   */
  public create(name?: string): E {
    let entity;
    if (this._entityPool) {
      entity = this._entityPool.acquire();
      entity._pooled = true;
      entity.name = name ?? null;
    } else {
      entity = new this._EntityClass(name);
    }
    entity['_world'] = this;
    this._components.initEntity(entity);
    return entity;
  }

  /**
   * Executes all systems groups, i.e., executes all registered systems
   *
   * @param delta - The delta time elapsed between the last call to `execute`,
   *   in milliseconds
   */
  public execute(delta: number): void {
    this._systems.execute(delta);
    this._postExecuteCmdBuffer.playback();
  }

  /**
   * ## Notes
   *
   * By default, entities aren't stored for fast retrieval with an identifier.
   * If you need this method to run fast, please create your own World class
   * and save entities based on their idenfitiers, i.e.,
   *
   * ```js
   * class MyWorld extends World {
   *   constructor(opts) {
   *     super(opts);
   *     this._entities = new Map();
   *   }
   *   create(id?: string) {
   *     const entity = super.create(id);
   *     // You can also check for duplicates, etc...
   *     this._entities.set(entity.id, entitiy);
   *     return s
   *   }
   *   findById(id: string) {
   *     // Do not call `super.findById()` here, you want to override the
   *     // implementation.
   *     return this._entities.get(id);
   *   }
   * }
   * ```
   *
   * @param {string} id
   * @returns {Option<Entity>}
   * @memberof World
   */
  public findByName(name: string): Nullable<Entity> {
    return this._components.findEntityByName(name);
  }

  public setEntityPool(pool: Nullable<EntityPool<this>>): this {
    this._entityPool = pool;
    return this;
  }

  public getEntityPool(): Option<Nullable<EntityPool<this>>> {
    return this._entityPool;
  }

  /**
   * Retrieves the system instance of type `Class`
   *
   * @param Class - Class of the system to retrieve
   * @return The system instance if found, `undefined` otherwise
   */
  public system<T extends System>(Class: SystemClass<T>): Option<T> {
    return this._systems.system(Class);
  }

  /**
   * Retrieves the group instance of type `Class`
   *
   * @param Class - Class of the group to retrieve
   * @return The group instance if found, `undefined` otherwise
   */
  public group<T extends SystemGroup>(Class: SystemGroupClass<T>): Option<T> {
    return this._systems.group(Class);
  }

  public setComponentPool<P extends ObjectPool<any>>(
    Class: ComponentClass<ComponentOf<P>>,
    pool: Nullable<P>
  ): this {
    this._components.setComponentPool(Class, pool);
    return this;
  }

  public getComponentPool<C extends Component>(
    Class: ComponentClass<C>
  ): Option<Nullable<ObjectPool<C>>> {
    return this._components.getComponentPool(Class);
  }

  /**
   * Returns the unique identifier of the given component typee
   *
   * @param Class - Type of the component to retrieve the id for
   *
   * @return The identifier of the component
   */
  public getComponentId(Class: ComponentClass): number {
    return this._components.getIdentifier(Class);
  }

  public get postExecuteCmdBuffer(): CommandBuffer {
    return this._postExecuteCmdBuffer;
  }

  /**
   * Returns the max number of components this world can store.
   *
   * **Note**: the number represents the count of component type (i.e., "class"),
   * and not the count of instance
   */
  public get maxComponentTypeCount(): number {
    return this._components.maxComponentTypeCount;
  }

  /** Internal API. */

  /**
   * @hidden
   */
  public _onArchetypeCreated(archetype: Archetype<EntityOf<this>>): void {
    this._queries.addArchetype(archetype);
  }

  /**
   * @hidden
   */
  public _onArchetypeDestroyed(archetype: Archetype<EntityOf<this>>): void {
    this._queries.removeArchetype(archetype);
  }

  /**
   * @hidden
   */
  public _onQueryCreated(query: Query<EntityOf<this>>): void {
    const archetypes = this._components.archetypes;
    archetypes.forEach((archetype) =>
      this._queries.addArchetypeToQuery(query, archetype)
    );
  }

  /**
   * @param {QueryComponents} components
   * @return todo
   * @hidden
   */
  public _requestQuery(components: QueryComponents): Query<EntityOf<this>> {
    return this._queries.request(components);
  }

  /**
   * @param {Query} query
   * @hidden
   */
  public _releaseQuery(query: Query<EntityOf<this>>): void {
    this._queries.release(query);
  }

  /**
   * @hidden
   *
   * ## Internals
   *
   * This method doesn't called `needArchetypeUpdate()` for performance
   * reasons. Here, we know the entity will simply be remove from its archetype,
   * and all its components will be disposed.
   *
   * @param entity -
   */
  public _destroyEntityRequest(entity: EntityOf<this>): void {
    this._components.destroyEntity(entity);
    if (entity.pooled) {
      this._entityPool?.release(entity);
    }
  }

  /**
   * @hidden
   */
  public _addComponentRequest<T extends Component>(
    entity: EntityOf<this>,
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): void {
    this._components.addComponentToEntity(entity, Class, opts);
  }

  /**
   * @hidden
   */
  public _removeComponentRequest<T extends Component>(
    entity: EntityOf<this>,
    Class: ComponentClass<T>
  ): void {
    this._components.removeComponentFromEntity(entity, Class);
  }
}

/**
 * Options for the [[World]] constructor
 */
export interface WorldOptions<E extends Entity> {
  /** Default list of systems to register. */

  systems: SystemClass[];

  /** Default list of components to register. */
  components: ComponentClass[];

  /**
   * Number of components that will be registered.
   *
   * This is used for performance reasons. It's preferable to give the exact
   * amount of component type you are going to use, but it's OK to give an
   * inflated number if you don't fully know in advanced all components that
   * will be used.
   *
   * Default: 256
   */
  maxComponentType: number;

  /**
   * If `true`, no pool is created by default for components and entities.
   *
   * Default: `false`
   */
  useManualPooling: boolean;

  /**
   * Class of entity to instanciate when calling `world.create()`.
   *
   * **Note**: if you use your own entity class, please make sure it's
   * compatible with the default entity pool (if not using a custom pool). Try
   * to keep the same interface (constructor, methods, etc...)
   *
   * Default: [[Entity]]
   */
  EntityClass: EntityClass<E>;

  /**
   * Class of the default pool that will be used for components.
   *
   * Using you custom default pool allow you to perform fine-tuned logic to
   * improve pooling performance.
   *
   * ## Notes
   *
   * The pool will be instanciated by the world using:
   *
   * ```js
   * const pool = new ComponentPoolClass(ComponentType);
   * ```
   *
   * Please ensure that your interface is compatible
   *
   * Default: [[DefaultPool]]
   */
  ComponentPoolClass: Constructor<ObjectPool<Component>>;

  /**
   * Class of the default pool that will be used for entities.
   *
   * Using you custom default pool allow you to perform fine-tuned logic to
   * improve pooling performance.
   *
   * ## Notes
   *
   * The pool will be instanciated by the world using:
   *
   * ```js
   * const pool = new EntityPoolClass(EntityClass);
   * ```
   *
   * Please ensure that your interface is compatible
   *
   * Default: [[DefaultPool]]
   */
  EntityPoolClass: Constructor<ObjectPool<E>>;
}

export interface SystemRegisterOptions<WorldType extends World> {
  group?: Constructor<SystemGroup<WorldType>>;
  order?: number;
}

type EntityPool<WorldType extends World> = ObjectPool<EntityOf<WorldType>>;
