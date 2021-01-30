import { sortByOrder, System } from '../system.js';
import { SystemGroup } from '../system-group.js';
import { SystemRegisterOptions, World } from '../world.js';
import { Constructor, Option, SystemClass, SystemGroupClass } from '../types';

export class SystemManager<WorldType extends World> {
  private _world: WorldType;
  private _groups: SystemGroup<WorldType>[];

  public constructor(world: WorldType) {
    this._world = world;
    this._groups = [new SystemGroup(this._world)];
  }

  public register<T extends System<WorldType>>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions<WorldType> = {}
  ): this {
    const {
      group = (Class.group ?? SystemGroup) as SystemGroupClass<SystemGroup<WorldType>>
    } = opts;
    let groupInstance = this._groups.find((g: SystemGroup) => {
      return (g.constructor as Constructor<SystemGroup<WorldType>>) === group;
    });
    if (!groupInstance) {
      groupInstance = new group(this._world);
    }
    groupInstance.add(new Class());
    groupInstance.sort();
    return this;
  }

  public tick(delta: number): void {
    const groups = this._groups;
    for (const group of groups) {
      if (group.enabled) {
        group.tick(delta);
      }
    }
  }

  public sort(): this {
    this._groups.sort(sortByOrder);
    return this;
  }

  public group<T extends SystemGroup>(Class: Constructor<T>): Option<T> {
    return this._groups.find((group: SystemGroup) => {
      Class === group.constructor;
    }) as Option<T>;
  }
}
