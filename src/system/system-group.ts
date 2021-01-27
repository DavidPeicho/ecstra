import { SystemClass } from "../types";
import { System } from "./system";

export enum SortType {
  Incremental = 'incremental',
  Topological = 'topological'
}

export class SystemGroup {

  public sortType: SortType;
  private _systems: System[];

  public constructor() {
    this.sortType = SortType.Topological;
    this._systems = [];
  }

  public add(system: System): void {
    if (this.sortType === SortType.Topological) {
      // @todo.
    }
    // @todo: lazy sort?
    this.sort();
  }

  public tick(delta: number): void {
    const systems = this._systems;
    for (const system of systems) {
      system.tick(delta);
    }
  }

  public sort(): void {
    if (this.sortType === SortType.Topological) {

    } else {
      this._systems.sort(orderSort);
    }
  }

}

function topologicalOrderSort(a: System, b: System): number {
  return a.order - b.order;
}

function orderSort(a: System, b: System): number {
  return a.order - b.order;
}
