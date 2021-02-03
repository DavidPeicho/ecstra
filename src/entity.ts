import { Archetype } from './internals/archetype.js';
import { Component } from './component.js';
import { World } from './world.js';
import { ComponentClass, Nullable, Option, PropertiesOf } from './types';
import { createUUID } from './utils.js';

export class Entity {
  public name: Nullable<string>;

  /**
   * @hidden
   */
  public _pooled: boolean;

  /**
   * @hidden
   */
  private _world: World;

  /**
   * @hidden
   */
  private readonly _id!: string;

  public readonly _components: Map<ComponentClass, Component>;
  public readonly _pendingComponents: Component[];

  /**
   * @hidden
   */
  private _archetype: Nullable<Archetype<this>>;

  public constructor(world: World, name?: string) {
    this.name = name ?? null;
    this._id = createUUID();
    this._components = new Map();
    this._pendingComponents = [];
    this._world = world;
    this._archetype = null;
    this._pooled = false;
  }

  public destroy(): void {
    this._world._destroyEntityRequest(this);
  }

  public add<T extends Component>(
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): this {
    this._world._addComponentRequest(this, Class, opts);
    return this;
  }

  public remove<T extends Component>(Class: ComponentClass<T>): this {
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

  public get id(): string {
    return this._id;
  }

  public get hasAnyComponent(): boolean {
    return this._components.size > 0;
  }

  public get componentClasses(): ComponentClass[] {
    return Array.from(this._components.keys());
  }

  public get archetype(): Nullable<Archetype<this>> {
    return this._archetype;
  }

  public get pooled(): boolean {
    return this._pooled;
  }
}
