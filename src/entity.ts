import { Archetype } from './internals/archetype.js';
import { Component } from './component.js';
import { World } from './world.js';
import { ComponentClass, Nullable, Option, PropertiesOf } from './types';

export class Entity {
  public readonly id!: string;

  public readonly _components: Map<ComponentClass, Component>;
  public readonly _pendingComponents: Component[];

  private _world: World;
  private _archetype: Nullable<Archetype<this>>;
  private _destroyed: boolean;

  public constructor(world: World, id: string) {
    this.id = id;
    this._components = new Map();
    this._pendingComponents = [];
    this._world = world;
    this._archetype = null;
    this._destroyed = false;
  }

  public destroy(): void {
    this._world._destroyEntity(this);
    this._destroyed = true;
  }

  public addComponent<T extends Component>(
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): this {
    this._world._addComponentRequest(this, Class, opts);
    return this;
  }

  public removeComponent<T extends Component>(
    Class: ComponentClass<T>
  ): this {
    this._world._removeComponentRequest(this, Class);
    return this;
  }

  public read<T extends Component>(Class: ComponentClass<T>): Option<T> {
    return this._components.get(Class) as Option<T>;
  }

  public write<T extends Component>(Class: ComponentClass<T>): Option<T> {
    // @todo: retrieve component in write mode
    return this._components.get(Class) as Option<T>;
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

  public get destroyed(): boolean {
    return this._destroyed;
  }

  public get hasPendingComponents(): boolean {
    return this._pendingComponents.length > 0;
  }
}
