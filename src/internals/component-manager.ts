import { Component, ComponentState, ComponentData } from '../component.js';
import { Entity } from '../entity.js';
import { ObjectPool } from '../pool.js';
import { World } from '../world.js';
import { Archetype } from './archetype.js';
import {
  ComponentClass,
  ComponentOf,
  Constructor,
  EntityOf,
  Nullable,
  Option,
  PropertiesOf
} from '../types';
import { process } from '../constants.js';

export class ComponentManager<WorldType extends World> {
  public readonly maxComponentTypeCount: number;

  public readonly archetypes: Map<string, Archetype<EntityOf<WorldType>>>;

  private readonly _world: WorldType;
  private readonly _data: Map<ComponentClass, ComponentCache>;
  private readonly _DefaulPool: Nullable<Constructor<ObjectPool<Component>>>;

  private readonly _emptyArchetype: Archetype<EntityOf<WorldType>>;
  private _lastIdentifier: number;

  public constructor(world: WorldType, options: ComponentManagerOptions) {
    const { maxComponentType, ComponentPoolClass = null } = options;
    this.maxComponentTypeCount = maxComponentType;
    this._world = world;
    this.archetypes = new Map();
    this._data = new Map();
    this._DefaulPool = ComponentPoolClass;
    this._lastIdentifier = 0;
    this._emptyArchetype = new Archetype([], '0'.repeat(maxComponentType));
    this.archetypes.set(this._emptyArchetype.hash, this._emptyArchetype);
  }

  public initEntity(entity: EntityOf<WorldType>): void {
    this._emptyArchetype.entities.push(entity);
    entity._archetype = this._emptyArchetype;
  }

  public destroyEntity(entity: EntityOf<WorldType>): void {
    const archetype = entity.archetype;
    if (archetype) {
      this._removeEntityFromArchetype(entity);
    }
  }

  public addComponentToEntity<T extends Component>(
    entity: EntityOf<WorldType>,
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): void {
    if (process.env.NODE_ENV === 'development') {
      if (entity.has(Class)) {
        const uuid = entity.id;
        const name = Class.Name ?? Class.name;
        console.warn(`adding duplicate component ${name} to entity ${uuid}`);
      }
    }
    const data = this.registerComponent(Class);
    let comp = null;
    if (data.pool) {
      comp = data.pool.acquire();
      comp._pooled = true;
    } else {
      comp = new Class();
    }
    if ((comp as ComponentData).isDataComponent && opts) {
      (comp as ComponentData).init(opts);
    }
    comp._state = ComponentState.Ready;
    // @todo: check in dev mode for duplicate.
    entity._components.set(Class, comp);
    this.updateArchetype(entity, Class);
  }

  public removeComponentFromEntity<T extends Component>(
    entity: EntityOf<WorldType>,
    Class: ComponentClass<T>
  ): void {
    const component = entity.write(Class)!;
    this._removeComponentsImmediate(entity, component);
    this.updateArchetype(entity, Class);
  }

  public getIdentifier(Class: ComponentClass): number {
    return this.registerComponent(Class).identifier;
  }

  public registerComponentManual(
    Class: ComponentClass,
    opts?: ComponentRegisterOptions
  ): void {
    if (process.env.NODE_ENV === 'development') {
      if (this._data.has(Class)) {
        const name = Class.Name ?? Class.name;
        console.warn(`component ${name} is already registered`);
      }
    }
    if (this._lastIdentifier >= this.maxComponentTypeCount) {
      throw new Error('reached maximum number of components registered.');
    }
    const identifier = this._lastIdentifier++;
    let pool = null as Nullable<ObjectPool<Component>>;
    if (opts && opts.pool) {
      pool = opts.pool;
    } else if (this._DefaulPool) {
      pool = new this._DefaulPool(Class);
      pool.expand(1);
    }
    this._data.set(Class, { identifier, pool });
  }

  public registerComponent(Class: ComponentClass): ComponentCache {
    if (!this._data.has(Class)) {
      this.registerComponentManual(Class);
    }
    return this._data.get(Class) as ComponentCache;
  }

  public updateArchetype(
    entity: EntityOf<WorldType>,
    Class: ComponentClass
  ): void {
    const hash = this._getArchetypeHash(entity, Class, entity.has(Class));
    this._moveEntityToArchetype(entity, hash);
  }

  public findEntityByName(name: string): Nullable<Entity> {
    for (const [_, archetype] of this.archetypes) {
      const entities = archetype.entities;
      for (const entity of entities) {
        if (entity.name === name) {
          return entity;
        }
      }
    }
    return null;
  }

  public setComponentPool<P extends ObjectPool<any>>(
    Class: ComponentClass<ComponentOf<P>>,
    pool: Nullable<P>
  ): this {
    const data = this.registerComponent(Class);
    if (data.pool && data.pool.destroy) {
      data.pool.destroy();
    }
    data.pool = pool;
    return this;
  }

  public getComponentPool<C extends Component>(
    Class: ComponentClass<C>
  ): Option<Nullable<ObjectPool<C>>> {
    return this._data.get(Class)?.pool as Option<Nullable<ObjectPool<C>>>;
  }

  private _removeComponentsImmediate(
    entity: Entity,
    component: Component
  ): void {
    const Class = component.constructor as ComponentClass;
    component._state = ComponentState.None;
    if (component.pooled) {
      this._data.get(Class)!.pool?.release(component);
    }
    entity._components.delete(Class);
  }

  private _moveEntityToArchetype(
    entity: EntityOf<WorldType>,
    hash: string
  ): void {
    this._removeEntityFromArchetype(entity);
    if (!this.archetypes.has(hash)) {
      const classes = entity.componentClasses;
      const archetype = new Archetype<EntityOf<WorldType>>(classes, hash);
      this.archetypes.set(archetype.hash, archetype);
      this._world._onArchetypeCreated(archetype);
    }
    const archetype = this.archetypes.get(hash) as Archetype<
      EntityOf<WorldType>
    >;
    archetype.add(entity);
  }

  private _removeEntityFromArchetype(entity: EntityOf<WorldType>): void {
    const archetype = entity.archetype as Archetype<EntityOf<WorldType>>;
    archetype.remove(entity);
    // @todo: that may not be really efficient if an archetype is always
    // composed of one entity getting attached / dettached.
    if (archetype !== this._emptyArchetype && archetype.empty) {
      this.archetypes.delete(archetype.hash);
      this._world._onArchetypeDestroyed(archetype);
    }
  }

  private _getArchetypeHash(
    entity: Entity,
    Class: ComponentClass,
    added: boolean
  ): string {
    const index = this.getIdentifier(Class);
    const entry = added ? '1' : '0';
    const arch = entity.archetype!;
    return `${arch.hash.substring(0, index)}${entry}${arch.hash.substring(
      index + 1
    )}`;
  }
}

export interface ComponentRegisterOptions {
  pool?: ObjectPool<Component>;
}

export type ComponentManagerOptions = {
  maxComponentType: number;
  ComponentPoolClass: Nullable<Constructor<ObjectPool<Component>>>;
};

type ComponentCache = {
  identifier: number;
  pool: Nullable<ObjectPool<Component>>;
};
