import { Archetype } from './internals/archetype.js';
import { Component } from './component.js';
import { World } from './world.js';
import { ComponentClass, Nullable, Option, PropertiesOf } from './types';
import { createUUID } from './utils.js';

/**
 * Entities are actors in the [[World]]. Entities hold data via [[Component]]
 * that get queried/transformed by [[System]].
 *
 * Entities can represent anything:
 *   * Player
 *   * Ennemies
 *   * Decors
 *   * Spawner
 *   * etc...
 *
 * @category entity
 */
export class Entity {
  /**
   * Name of the entity. This should be sepcified by a user, and is used to
   * retrieve entities
   */
  public name: Nullable<string>;

  /**
   * @hidden
   */
  public _pooled: boolean;

  /**
   * @hidden
   */
  public readonly _components: Map<ComponentClass, Component>;

  /**
   * @hidden
   */
  public readonly _pendingComponents: Component[];

  /**
   * @hidden
   */
  public _archetype: Nullable<Archetype<this>>;

  /**
   * @hidden
   */
  public _indexInArchetype: number;

  /**
   * @hidden
   */
  private _world!: World;

  /**
   * @hidden
   */
  private readonly _id!: string;

  public constructor(name?: string) {
    this.name = name ?? null;
    this._id = createUUID();
    this._components = new Map();
    this._pendingComponents = [];
    this._archetype = null;
    this._indexInArchetype = -1;
    this._pooled = false;
  }

  /**
   * Destroys the entity and removes it from the world.
   *
   * **Note**: when destroyed, an entity can be re-used
   */
  public destroy(): void {
    this._world._destroyEntityRequest(this);
  }

  /**
   * Adds a component of type `Class` to this entity
   *
   * @param Class - Class of the component to add
   * @param opts - Options object to initialize the component
   * @return This instance
   */
  public add<T extends Component>(
    Class: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): this {
    this._world._addComponentRequest(this, Class, opts);
    return this;
  }

  /**
   * Removes the component of type `Class` from this entity
   *
   * @param Class - Class of the component to remove
   * @return This instance
   */
  public remove<T extends Component>(Class: ComponentClass<T>): this {
    this._world._removeComponentRequest(this, Class);
    return this;
  }

  /**
   * Returns the instance of the component of type `Class` as **read-only**.
   *
   * **Note**: right now, read-only and read-write mode are similar and do not
   * do anything special
   *
   * @param Class - Class of the component to retrieve
   * @return The component instance if found, `undefined` otherwise
   */
  public read<T extends Component>(Class: ComponentClass<T>): Option<T> {
    return this._components.get(Class) as Option<T>;
  }

  /**
   * Returns the instance of the component of type `Class` for **read-write**.
   *
   * **Note**: right now, read-only and read-write mode are similar and do not
   * do anything special
   *
   * @param Class - Class of the component to retrieve
   * @return The component instance if found, `undefined` otherwise
   */
  public write<T extends Component>(Class: ComponentClass<T>): Option<T> {
    // @todo: retrieve component in write mode
    return this._components.get(Class) as Option<T>;
  }

  /**
   * Returns `true` if a component instance of type `Class` is found
   *
   * @param Class - Class of the component to check
   * @return `true` if the component instance exists, `false` otherwise
   */
  public has(Class: ComponentClass): boolean {
    return this._components.has(Class);
  }

  /**
   * Returns the identifier (UUID) of this entity
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Returns `true` is this entity is empty, i.e., has no components
   */
  public get isEmpty(): boolean {
    return this._components.size === 0;
  }

  /**
   * Returns an array of all component classes stored in this entity
   *
   * **Note**: do not overuse this method, it allocates a new array each time
   */
  public get componentClasses(): ComponentClass[] {
    return Array.from(this._components.keys());
  }

  /**
   * Returns a reference to the archetype in which the entity is added
   */
  public get archetype(): Nullable<Archetype<this>> {
    return this._archetype;
  }

  /** Returns `true` if this instance has been created by a pool, `false`
   * otherwise
   */
  public get pooled(): boolean {
    return this._pooled;
  }
}
