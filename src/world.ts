import { GenericComponent } from './component';
import { process } from './constants';
import { Entity } from './entity';
import { ArchetypeManager } from './internals/archetype-manager';
import { ComponentManager } from './internals/component-manager';
import { SystemManager } from './internals/systems-manager';
import { System } from './system/system';
import { SystemGroup } from './system/system-group';
import { ComponentClass, Constructor, SystemClass } from './types';
import { createUUID } from './utils';

export class World<E extends Entity = Entity> {
  private _entities: Map<string, E>;
  private _components: ComponentManager;
  private _archetypes: ArchetypeManager;
  private _systems: SystemManager;
  private _EntityClass: EntityClass<E>;

  public constructor(options: Partial<WorldOptions<E>> = {}) {
    const {
      maxComponentType = 256,
      EntityClass = Entity as EntityClass<E>
    } = options;
    this._entities = new Map();
    this._components = new ComponentManager({ maxComponentType });
    this._archetypes = new ArchetypeManager(this);
    this._systems = new SystemManager();
    this._EntityClass = EntityClass;
  }

  public register<T extends System>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions
  ): this {
    return this;
  }

  public create(id?: string): E {
    id = id ?? createUUID();
    if (process.env.NODE_ENV === 'development') {
      if (this._entities.has(id)) {
        throw new Error(`found duplicated entity with id: '${id}'`);
      }
    }
    const entity = new this._EntityClass(this, id);
    this._entities.set(id, entity);
    return entity;
  }

  public tick(delta: number): void {
    this._systems.tick(delta);
  }

  private _addEntity(entity: E): void {}

  private _destroyEntity(entity: E): void {
    this._archetypes.removeEntity(entity);
  }

  private _addComponent<T extends GenericComponent>(
    entity: Entity,
    Class: ComponentClass<T>
  ): T {
    // @todo: object pool.
    this._components.registerComponent(Class);
    this._archetypes.addComponent(entity, Class);
    return new Class();
  }

  private _removeComponent<T extends GenericComponent>(
    entity: Entity,
    Class: ComponentClass<T>
  ): T {
    // @todo: object pool.
    this._archetypes.removeComponent(entity, Class);
  }
}

export type WorldOptions<E extends Entity> = {
  maxComponentType: number;
  components: ComponentClass[];
  EntityClass: EntityClass<E>;
};

export interface SystemRegisterOptions {
  group?: Constructor<SystemGroup>;
  order?: number;
}

export type EntityClass<E extends Entity> = Constructor<E>;
