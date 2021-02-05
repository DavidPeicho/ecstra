import { sortByOrder, System } from '../system.js';
import { SystemGroup } from '../system-group.js';
import { SystemRegisterOptions, World } from '../world.js';
import { Constructor, Option, SystemClass, SystemGroupClass } from '../types';
import { process } from '../constants.js';

/**
 * Manages registered systems in a world instance
 *
 * @category System
 *
 * @hidden
 */
export class SystemManager<WorldType extends World> {
  private _world: WorldType;
  private _groups: SystemGroup<WorldType>[];
  private _systems: Map<SystemClass, System>;

  public constructor(world: WorldType) {
    this._world = world;
    this._groups = [new SystemGroup(this._world)];
    this._systems = new Map();
  }

  public register<T extends System<WorldType>>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions<WorldType> = {}
  ): this {
    if (this._systems.has(Class)) {
      if (process.env.NODE_ENV === 'development') {
        const name = Class.Name ?? Class.name;
        throw new Error(`system '${name}' is already registered`);
      }
      return this;
    }

    const {
      group = (Class.Group ?? SystemGroup) as SystemGroupClass<
        SystemGroup<WorldType>
      >
    } = opts;
    let groupInstance = this._groups.find((g: SystemGroup) => {
      return (g.constructor as Constructor<SystemGroup<WorldType>>) === group;
    });
    if (!groupInstance) {
      groupInstance = new group(this._world);
    }
    const system = new Class(groupInstance, opts);
    this._systems.set(Class, system);
    groupInstance.add(system);
    groupInstance.sort();
    return this;
  }

  /**
   * Executes every registered group, and so systems
   *
   * @param delta - Delta time with previous call to execute
   */
  public execute(delta: number): void {
    const groups = this._groups;
    for (const group of groups) {
      if (group.enabled) {
        group.execute(delta);
      }
    }
  }

  /**
   * Sorts group using priorities number
   *
   * **Note**: this only sorts group relative to each other, and doesn't
   * sort systems in group.
   */
  public sort(): void {
    this._groups.sort(sortByOrder);
  }

  /**
   * Returns the group of type `Class`
   *
   * @param Class SystemGroup class used to find instance
   *
   * @return Returns the instance of type `Class` if it exists. `undefined`
   *   otherwise
   */
  public group<T extends SystemGroup>(Class: Constructor<T>): Option<T> {
    return this._groups.find((group: SystemGroup) => {
      Class === group.constructor;
    }) as Option<T>;
  }

  /**
   * Returns the system of type `Class`
   *
   * @param Class System class used to find instance
   *
   * @return Returns the instance of type `Class` if it exists. `undefined`
   *   otherwise
   */
  public system<T extends System>(Class: SystemClass<T>): Option<T> {
    return this._systems.get(Class) as Option<T>;
  }
}
