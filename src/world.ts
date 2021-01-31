import { Entity } from './entity.js';
import { ComponentManager } from './internals/component-manager.js';
import { QueryManager } from './internals/query-manager.js';
import { SystemManager } from './internals/system-manager.js';
import { System } from './system.js';
import { SystemGroup } from './system-group.js';
import { createUUID } from './utils.js';
import { Component } from './component.js';
import { Query, QueryComponents } from './query.js';
import { ObjectPool } from './pool.js';
import {
  ComponentClass,
  ComponentOf,
  Constructor,
  EntityOf,
  Nullable,
  Option,
  PropertiesOf,
  SystemClass
} from './types';
import { ComponentCommandBuffer } from './internals/commands-manager.js';

export class World<E extends Entity = Entity> {

  protected readonly _components: ComponentManager<this>;
  protected readonly _queries: QueryManager<this>;
  protected readonly _systems: SystemManager<this>;
  protected readonly _EntityClass: EntityClass<EntityOf<this>>;

  private readonly _componentsCmdBuffer: ComponentCommandBuffer;
  private readonly _entitiesCommands: E[];

  /** Public API. */

  public constructor(options: Partial<WorldOptions<E>> = {}) {
    const {
      maxComponentType = 256,
      useManualPooling = true,
      useEntityCommandBuffer = false,
      useComponentCommandBuffer = false,
      EntityClass = Entity
    } = options;
    this._queries = new QueryManager(this);
    this._systems = new SystemManager(this);
    this._components = new ComponentManager(this, {
      maxComponentType,
      useManualPooling
    });
    this._componentsCmdBuffer = new ComponentCommandBuffer(this._components);
    this._entitiesCommands = [];
    this._EntityClass = EntityClass as EntityClass<EntityOf<this>>;
  }

  public register<T extends System<this>>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions<this>
  ): this {
    this._systems.register(Class, opts);
    return this;
  }

  public create(id?: string): E {
    id = id ?? createUUID();
    // @todo: __DEV__ #define
    // if (this._entities.has(id)) {
    //   throw new Error(`found duplicated entity with id: '${id}'`);
    // }
    const entity = new this._EntityClass(this, id);
    this._components.setupEntity(entity);
    return entity;
  }

  public tick(delta: number): void {
    this._componentsCmdBuffer.lock();
    this._systems.tick(delta);
    this._componentsCmdBuffer.apply().unlock();

    // Applies command buffers.
    // for (const entity of this._entitiesCommands) {
    //   this._destroyEntityImmediate(entity);
    // }
    // this._entitiesCommands.length = 0;
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
  public findById(id: string): Nullable<Entity> {
    return this._components.findEntityById(id);
  }

  public setComponentPool<P extends ObjectPool<any>>(
    Class: ComponentClass<ComponentOf<P>>,
    pool: Nullable<P>
  ): this {
    this._components.setComponentPool(Class, pool);
    return this;
  }

  public getComponentPool<C extends Component>(Class: ComponentClass<C>): Option<Nullable<ObjectPool<C>>> {
    return this._components.getComponentPool(Class);
  }

  public getComponentId(Class: ComponentClass): number {
    return this._components.getIdentifier(Class);
  }

  public get maxComponentTypeCount(): number {
    return this._components.maxComponentTypeCount;
  }

  /** Internal API. */

  public _requestQuery(components: QueryComponents): Query<EntityOf<this>> {
    return this._queries.request(components);
  }

  public _destroyEntity(entity: E, immediate: boolean = false): void {
    if (this._isLocked && !immediate) {
      this._entitiesCommands.push(entity);
    } else {
      this._destroyEntityImmediate(entity);
    }
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
  public _destroyEntityImmediate(entity: E): void {
    // @todo: add deferred removal?
    this._archetypes.removeEntity(entity);
    // Destroys all components.
    const components = entity['_components'];
    for (const [ _, component ] of components) {
      this._components.release(component);
    }
    components.clear();
  }

  /**
   * @hidden
   *
   * @template T
   * @param entity -
   * @param Class -
   * @param opts -
   */
  public _addComponentRequest<T extends Component>(
    entity: EntityOf<this>,
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): void {
    // @todo
  }

  /**
   * @hidden
   *
   * @template T -
   * @param entity -
   * @param Class -
   * @return
   */
  public _removeComponentRequest<T extends Component>(
    entity: EntityOf<this>,
    Class: ComponentClass<T>
  ): void {
    this._componentsCmdBuffer.removeComponent(entity, Class);
  }
}

export type WorldOptions<E extends Entity> = {
  systems: SystemClass[];
  components: ComponentClass[];
  maxComponentType: number;
  useManualPooling: boolean;
  useEntityCommandBuffer: boolean;
  useComponentCommandBuffer: boolean;
  EntityClass: EntityClass<E>;
};

export interface SystemRegisterOptions<WorldType extends World> {
  group?: Constructor<SystemGroup<WorldType>>;
  order?: number;
}

export type EntityClass<E extends Entity> = Constructor<E>;
