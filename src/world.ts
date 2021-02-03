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
  SystemClass
} from './types';
import { Archetype } from './internals/archetype.js';

export class World<E extends Entity = Entity> {
  protected readonly _components: ComponentManager<this>;
  protected readonly _queries: QueryManager<this>;
  protected readonly _systems: SystemManager<this>;
  protected readonly _EntityClass: EntityClass<EntityOf<this>>;
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

  public register<T extends System<this>>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions<this>
  ): this {
    this._systems.register(Class, opts);
    return this;
  }

  public create(name?: string): E {
    // @todo: __DEV__ #define
    // if (this._entities.has(id)) {
    //   throw new Error(`found duplicated entity with id: '${id}'`);
    // }
    let entity;
    if (this._entityPool) {
      entity = this._entityPool.acquire();
      entity._pooled = true;
      entity.name = name ?? null;
    } else {
      entity = new this._EntityClass(this, name);
    }
    this._components.initEntity(entity);
    return entity;
  }

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

  public system<T extends System>(Class: SystemClass<T>): Option<T> {
    return this._systems.system(Class);
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

  public getComponentId(Class: ComponentClass): number {
    return this._components.getIdentifier(Class);
  }

  public get maxComponentTypeCount(): number {
    return this._components.maxComponentTypeCount;
  }

  /** Internal API. */

  public _onArchetypeCreated(archetype: Archetype<EntityOf<this>>): void {
    this._queries.addArchetype(archetype);
  }

  public _onArchetypeDestroyed(archetype: Archetype<EntityOf<this>>): void {
    this._queries.removeArchetype(archetype);
  }

  public _requestQuery(components: QueryComponents): Query<EntityOf<this>> {
    return this._queries.request(components);
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
    this._components.addComponentToEntity(entity, Class, opts);
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
    this._components.removeComponentFromEntity(entity, Class);
  }
}

export type WorldOptions<E extends Entity> = {
  systems: SystemClass[];
  components: ComponentClass[];
  maxComponentType: number;
  useManualPooling: boolean;
  EntityClass: EntityClass<E>;
};

export interface SystemRegisterOptions<WorldType extends World> {
  group?: Constructor<SystemGroup<WorldType>>;
  order?: number;
}

export type EntityClass<E extends Entity> = Constructor<E>;

type EntityPool<WorldType extends World> = ObjectPool<EntityOf<WorldType>>;
