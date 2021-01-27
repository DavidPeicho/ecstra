import { System } from "../system/system";
import { SystemGroup } from "../system/system-group";
import { Constructor, SystemClass } from "../types";
import { SystemRegisterOptions } from "../world";

export class SystemManager {

  private _groups: SystemGroup[];

  public constructor() {
    this._groups = [ new SystemGroup() ];
  }

  public register<T extends System>(
    Class: SystemClass<T>,
    opts: SystemRegisterOptions = {}
  ): this {
    const {
      group = Class.group ?? SystemGroup
    } = opts;
    let groupInstance = this._groups.find((g: SystemGroup) => {
      return (g.constructor as Constructor<SystemGroup> === group);
    });
    if (!groupInstance) {
      groupInstance = new group();
    }
    groupInstance.sort();
    return this;
  }

  public tick(delta: number): void {
    const groups = this._groups;
    for (const group of groups) {
      group.tick(delta);
    }
  }

}


