import { Entity } from './entity';
import { ArchetypeManager } from './internals/archetype-manager';
import { ComponentManager } from './internals/component-manager';
import { QueryManager } from './internals/query-manager';
import { SystemManager } from './internals/system-manager';
import { System } from './system/system';
import { SystemGroup } from './system/system-group';
import { ComponentClass, Constructor, SystemClass } from './types';

export class World<E extends Entity = Entity> {

  protected readonly _archetypes: ArchetypeManager;
  protected readonly _queries: QueryManager;
  protected readonly _entities: Map<string, E>;
  protected readonly _components: ComponentManager;
  protected readonly _systems: SystemManager<E, this>;
  protected readonly _EntityClass: EntityClass;

  public constructor(options: Partial<WorldOptions<E>> = {}) {
    const {
      maxComponentType = 256,
      EntityClass = Entity as EntityClass<E>
    } = options;
    this._archetypes = new ArchetypeManager(this);
    this._queries = new QueryManager(this);
    this._systems = new SystemManager(this);
    this._entities = new Map();
    this._components = new ComponentManager({ maxComponentType });
    this._EntityClass = EntityClass;
  }

  public register<T extends System>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions
  ): this {
    this._systems.add(Class, opts);
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

  public getComponentId(Class: ComponentClass): number {
    return this._components.getIdentifier(Class);
  }

  public get maxComponentTypeCount(): number {
    return this._components.maxComponentTypeCount;
  }

  public _registerComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): number {
    return this._components.registerComponent(Class);
  }

  public _requestQuery(components: QueryComponents): Query {
    return this._queries.request(components);
  }

  public _onEntityDestroyed(entity: E): void {
    this._archetypes.removeEntity(entity);
  }

  public _onRemoveComponentFromEntity<T extends GenericComponent>(
    entity: Entity,
    Class: ComponentClass<T>
  ): T {
    // @todo: object pool.
    // @todo: check in dev mode for duplicate.
    this.registerComponent(Class);
    this._archetypes.addComponent(entity, Class);
    return new Class();
  }

  public _onAddComponentToEntity<T extends GenericComponent>(
    entity: Entity,
    Class: ComponentClass<T>
  ): void {
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
