import { Component, ComponentState, DataComponent } from '../component';
import { Entity } from '../entity';
import { DefaultPool, ObjectPool } from '../pool';
import { ComponentClass, ComponentOf, EntityOf, Nullable, Option, PropertiesOf } from '../types';
import { World } from '../world';
import { Archetype } from './archetype';

export class ComponentManager<WorldType extends World> {
  public defer: boolean;
  public readonly maxComponentTypeCount: number;

  private readonly _world: WorldType;
  private readonly _archetypes: Map<string, Archetype<EntityOf<WorldType>>>;
  private readonly _emptyHash: string;
  private _locked: boolean;

  private readonly _useManualPooling: boolean;

  private _lastIdentifier: number;
  private _data: Map<ComponentClass, ComponentData>;

  private _commandBuffer: EntityOf<WorldType>[];

  public constructor(world: WorldType, options: ComponentManagerOptions) {
    const { maxComponentType, useManualPooling } = options;
    this.defer = false;
    this.maxComponentTypeCount = maxComponentType;
    this._useManualPooling = useManualPooling;
    this._lastIdentifier = 0;
    this._data = new Map();

    this._world = world;
    this._locked = false;
    this._archetypes = new Map();
    this._commandBuffer = [];
    this._emptyHash = '0'.repeat(world.maxComponentTypeCount);
    this._archetypes.set(this._emptyHash, new Archetype([], this._emptyHash));
  }

  public addComponentToEntity<T extends Component>(
    entity: EntityOf<WorldType>,
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): void {
    // @todo: check in dev mode for duplicate.
    entity['_components'].set(Class, this.acquire(Class, opts));
    this.updateArchetype(entity, Class);
  }

  public removeComponentFromEntity<T extends Component>(
    entity: EntityOf<WorldType>,
    Class: ComponentClass<T>
  ): void {
    const component = entity.write(Class)!;
    if (this._locked) {
      if (!entity.hasPendingComponents) {
        component['_state'] = ComponentState.Removed;
        entity._pendingComponents.push(component);
        this._commandBuffer.push(entity);
      }
    } else {
      this._removeComponentsImmediate(entity, component);
      this.updateArchetype(entity, Class);
    }
  }

  public applyPendingCommands(): void {
    for (const entity of this._commandBuffer) {
      for (const component of entity._pendingComponents) {
        this._removeComponentsImmediate(entity, component);
      }
      this.updateArchetypeFromPending(entity);
    }
    this._commandBuffer.length = 0;
  }

  public getIdentifier(Class: ComponentClass): number {
    return this._data.get(Class)!.identifier;
  }

  public acquire(Class: ComponentClass, opts?: PropertiesOf<Component>): Component {
    const data = this.registerComponent(Class);
    let comp = null;
    if (data.pool) {
      comp = data.pool.acquire();
      comp['_pooled'] = true;
    } else {
      comp = new Class();
    }
    if ((comp as DataComponent).isDataComponent && opts) {
      (comp as DataComponent).copy(opts, true);
    }
    return comp;
  }

  public registerComponent(Class: ComponentClass): ComponentData {
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

  public setupEntity(entity: EntityOf<WorldType>): void {
    const archetype = this._archetypes.get(this._emptyHash)!;
    archetype.entities.push(entity);
  }

  public removeEntity(entity: Entity): void {
    const archetype = entity.archetype;
    if (archetype) {
      archetype.entities.splice(archetype.entities.indexOf(entity), 1);
      entity['_archetype'] = null;
      // @todo: that may not be really efficient if an archetype is always
      // composed of one entity getting attached / dettached.
      if (archetype.entities.length === 0) {
        this._archetypes.delete(archetype.hash);
      }
    }
  }

  public updateArchetype(entity: EntityOf<WorldType>, Class: ComponentClass): void {
    const prevArchetype = entity.archetype;
    if (prevArchetype) {
      // Removes from previous archetype
      prevArchetype.entities.splice(prevArchetype.entities.indexOf(entity), 1);
    }
    const newArchetypeHash = this._getArchetypeHash(entity, Class, entity.hasComponent(Class));
    if (!this._archetypes.has(newArchetypeHash)) {
      const classes = entity.componentClasses;
      const archetype = new Archetype<EntityOf<WorldType>>(classes, newArchetypeHash);
      this._archetypes.set(newArchetypeHash, archetype);
    }
    const archetype = this._archetypes.get(newArchetypeHash)!;
    archetype.entities.push(entity);
  }

  public updateArchetypeFromPending(entity: EntityOf<WorldType>): void {
    // @todo: refactor with above?
    // Passing string around will create copies...
    const prevArchetype = entity.archetype;
    if (prevArchetype) {
      // Removes from previous archetype
      prevArchetype.entities.splice(prevArchetype.entities.indexOf(entity), 1);
    }
    const newArchetypeHash = this._getArchetypeFromPending(entity);
    if (!this._archetypes.has(newArchetypeHash)) {
      const classes = entity.componentClasses;
      const archetype = new Archetype<EntityOf<WorldType>>(classes, newArchetypeHash);
      this._archetypes.set(newArchetypeHash, archetype);
    }
    const archetype = this._archetypes.get(newArchetypeHash)!;
    archetype.entities.push(entity);
  }

  public findEntityById(id: string): Nullable<Entity> {
    for (const [ _, archetype ] of this._archetypes) {
      const entities = archetype.entities;
      for (const entity of entities) {
        if (entity.id === id) {
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

  public getComponentPool<C extends Component>(Class: ComponentClass<C>): Option<Nullable<ObjectPool<C>>> {
    return this._data.get(Class)?.pool as Option<Nullable<ObjectPool<C>>>;
  }

  public lock(): void {
    this._locked = this.defer;
  }

  public unlock(): void {
    this._locked = false;
  }

  private _removeComponentsImmediate(entity: Entity, component: Component): void {
    const Class = component.constructor as ComponentClass;
    component['_state'] = ComponentState.None;
    if (component.pooled) {
      this._data.get(Class)!.pool?.release(component);
    }
    entity._components.delete(Class);
  }

  private _getArchetypeFromPending(entity: Entity): string {
    let hash = entity.archetype ? entity.archetype.hash : this._emptyHash;
    for (const comp of entity._pendingComponents) {
      const Class = comp.constructor as ComponentClass;
      const added = comp.state !== ComponentState.Removed;
      hash = this._getArchetypeHash(entity, Class, added);
    }
    return hash;
  }

  private _getArchetypeHash(entity: Entity, Class: ComponentClass, added: boolean): string {
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

type ComponentData = {
  identifier: number;
  pool: Nullable<ObjectPool<Component>>;
}
