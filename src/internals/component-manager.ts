import { Component, ComponentState, ComponentData } from '../component.js';
import { Entity } from '../entity.js';
import { DefaultPool, ObjectPool } from '../pool.js';
import { World } from '../world.js';
import { Archetype } from './archetype.js';
import {
  ComponentClass,
  ComponentOf,
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

  private readonly _useManualPooling: boolean;

  private readonly _emptyHash: string;
  private _lastIdentifier: number;

  public constructor(world: WorldType, options: ComponentManagerOptions) {
    const { maxComponentType, useManualPooling } = options;
    this.maxComponentTypeCount = maxComponentType;
    this._world = world;
    this.archetypes = new Map();
    this._data = new Map();
    this._useManualPooling = useManualPooling;
    this._lastIdentifier = 0;
    this._emptyHash = '0'.repeat(maxComponentType);

    this.archetypes.set(this._emptyHash, new Archetype([], this._emptyHash));
  }

  public initEntity(entity: EntityOf<WorldType>): void {
    const archetype = this.archetypes.get(this._emptyHash)!;
    archetype.entities.push(entity);
  }

  public destroyEntity(entity: Entity): void {
    const archetype = entity.archetype;
    if (archetype) {
      archetype.entities.splice(archetype.entities.indexOf(entity), 1);
      entity['_archetype'] = null;
      // @todo: that may not be really efficient if an archetype is always
      // composed of one entity getting attached / dettached.
      if (archetype.entities.length === 0) {
        this.archetypes.delete(archetype.hash);
      }
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
      (comp as ComponentData).copy(opts, true);
    }
    comp._state = ComponentState.Ready;
    // @todo: check in dev mode for duplicate.
    entity['_components'].set(Class, comp);
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
    this.registerComponent(Class);
    return this._data.get(Class)!.identifier;
  }

  public registerComponent(Class: ComponentClass): ComponentCache {
    if (!this._data.has(Class)) {
      if (this._lastIdentifier >= this.maxComponentTypeCount) {
        throw new Error('reached maximum number of components registered.');
      }
      const identifier = this._lastIdentifier++;
      const pool = !this._useManualPooling ? new DefaultPool(Class) : null;
      this._data.set(Class, { identifier, pool });
    }
    return this._data.get(Class)!;
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
      this.archetypes.set(hash, archetype);
      this._world._onArchetypeCreated(archetype);
    }
    const archetype = this.archetypes.get(hash)!;
    archetype.entities.push(entity);
    entity['_archetype'] = archetype;
  }

  private _removeEntityFromArchetype(entity: EntityOf<WorldType>): void {
    const archetype = entity.archetype;
    if (archetype) {
      entity['_archetype'] = null;
      // Removes from previous archetype
      archetype.entities.splice(archetype.entities.indexOf(entity), 1);
      // @todo: that may not be really efficient if an archetype is always
      // composed of one entity getting attached / dettached.
      if (archetype.entities.length === 0) {
        this.archetypes.delete(archetype.hash);
        this._world._onArchetypeDestroyed(archetype);
      }
    }
  }

  private _getArchetypeHash(
    entity: Entity,
    Class: ComponentClass,
    added: boolean
  ): string {
    const index = this._world['_components'].getIdentifier(Class);
    const entry = added ? '1' : '0';
    const hash = entity.archetype ? entity.archetype.hash : this._emptyHash;
    return `${hash.substring(0, index)}${entry}${hash.substring(index + 1)}`;
  }
}

export type ComponentManagerOptions = {
  maxComponentType: number;
  useManualPooling: boolean;
};

type ComponentCache = {
  identifier: number;
  pool: Nullable<ObjectPool<Component>>;
};
