import { Archetype } from './internals/archetype.js';
import { GenericComponent } from './component.js';
import { World } from './world.js';
import { ComponentClass, Nullable, Option } from './types';

export enum Accessor {
  Read = 'read',
  Write = 'write'
}

export class Entity {
  public readonly id!: string;

  public readonly _components: Map<ComponentClass, GenericComponent>;
  private _world: World;
  private _archetype: Nullable<Archetype<this>>;

  public constructor(world: World, id: string) {
    this.id = id;
    this._components = new Map();
    this._world = world;
    this._archetype = null;
  }

  public destroy(): void {
    this._world._onEntityDestroyed(this);
  }

  public addComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): this {
    this._world._onAddComponentToEntity(this, Class);
    return this;
  }

  public removeComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): this {
    if (this._components.has(Class)) {
      this._world._onRemoveComponentFromEntity(this, Class);
      this._components.delete(Class);
    }
    return this;
  }

  public getComponent<T extends GenericComponent>(
    Class: ComponentClass<T>,
    accessor?: Accessor
  ): Option<T> {
    return this._components.get(Class) as Option<T>;
  }

  public getOrCreateComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): T {
    if (!this.hasComponent) {
      this.addComponent(Class);
    }
    return this.getComponent(Class)!;
  }

  public hasComponent(Class: ComponentClass): boolean {
    return this._components.has(Class);
  }

  public get componentClasses(): ComponentClass[] {
    return Array.from(this._components.keys());
  }

  public get archetype(): Nullable<Archetype<this>> {
    return this._archetype;
  }
}
