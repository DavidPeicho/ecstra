import { Entity } from './entity.js';
import { ComponentManager } from './internals/component-manager.js';
import { QueryManager } from './internals/query-manager.js';
import { SystemManager } from './internals/system-manager.js';
import { System } from './system.js';
import { SystemGroup } from './system-group.js';
import { Component } from './component.js';
import { Query, QueryComponents } from './query.js';
import { DefaultPool, ObjectPool } from './pool.js';
import {
  ComponentClass,
  ComponentOf,
  Constructor,
  EntityOf,
  Nullable,
  Option,
  PropertiesOf,
  SystemClass,
  SystemGroupClass
} from './types';
import { Archetype } from './internals/archetype.js';

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

  /** Public API. */

  public constructor(options: Partial<WorldOptions<E>> = {}) {
    const {
      maxComponentType = 256,
      useManualPooling = true,
      EntityClass = Entity
    } = options;
    this._queries = new QueryManager(this);
    this._systems = new SystemManager(this);
    this._components = new ComponentManager(this, {
      maxComponentType,
      useManualPooling
    });
    this._EntityClass = EntityClass as EntityClass<EntityOf<this>>;
    this._entityPool = !useManualPooling
      ? new DefaultPool(this._EntityClass)
      : null;
  }

  public registerComponent(Class: ComponentClass): this {
    this._components.registerComponent(Class);
    return this;
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
      entity['_world'] = this;
      entity._pooled = true;
      entity.name = name ?? null;
    } else {
      entity = new this._EntityClass(this, name);
    }
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
   * @return The identifier of the component
   */
  public getComponentId(Class: ComponentClass): number {
    return this._components.getIdentifier(Class);
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

export interface WorldOptions<E extends Entity> {
  systems: SystemClass[];
  components: ComponentClass[];
  maxComponentType: number;
  useManualPooling: boolean;
  EntityClass: EntityClass<E>;
}

export interface SystemRegisterOptions<WorldType extends World> {
  group?: Constructor<SystemGroup<WorldType>>;
  order?: number;
}

export type EntityClass<E extends Entity> = Constructor<E>;

type EntityPool<WorldType extends World> = ObjectPool<EntityOf<WorldType>>;
