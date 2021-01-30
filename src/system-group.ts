import { World } from './world.js';
import { sortByOrder, System } from './system.js';
import { SystemClass } from './types';

export class SystemGroup<WorldType extends World = World> {
  public static Name: string = 'Default';

  public enabled: boolean;
  public order: number;
  public useTopologicalSorting: boolean;

  /**
   * @hidden
   */
  private _world: WorldType;
  protected _systems: System<WorldType>[];

  public constructor(world: WorldType) {
    this.enabled = true;
    this.order = 0;
    this.useTopologicalSorting = true;
    this._world = world;
    this._systems = [];
  }

  public add(system: System<WorldType>): void {
    // @todo: checks it's not already added.
    this._systems.push(system);
  }

  public tick(delta: number): void {
    const systems = this._systems;
    for (const system of systems) {
      if (system.enabled) {
        system.tick(delta);
      }
    }
  }

  public sort(): void {
    if (this.useTopologicalSorting) {
      this._sortTopological();
    }
    this._systems.sort(sortByOrder);
  }

  private _sortTopological(): void {
    const nodes = new Map<SystemClass, Node>();
    const systems = this._systems;

    for (const system of systems) {
      // @todo: check for duplicate.
      // @todo: save the nodes map.
      const Class = system.constructor as SystemClass;
      nodes.set(Class, { next: [], system, visited: false });
    }

    // @todo: use indices instead of changing lenght.
    systems.length = 0;
    for (const [Class, node] of nodes) {
      if (Class.updateAfter) {
        for (const AfterClass of Class.updateAfter) {
          nodes.get(AfterClass)?.next.push(Class);
        }
      }
      if (Class.updateBefore) {
        for (const BeforeClass of Class.updateBefore) {
          if (nodes.has(BeforeClass)!) {
            node.next.push(BeforeClass);
          }
        }
      }
      topologicalSortRec(systems, Class, nodes);
    }
  }

  public get world(): WorldType {
    return this._world;
  }
}

function topologicalSortRec(
  result: System[],
  Class: SystemClass,
  visited: Map<SystemClass, Node>
): void {
  const node = visited.get(Class)!;
  if (!node) {
    return;
  }
  node.visited = true;
  for (const next of node.next) {
    topologicalSortRec(result, next, visited);
  }
  result.unshift(node.system);
}

type Node = {
  next: SystemClass[];
  visited: boolean;
  system: System;
};
