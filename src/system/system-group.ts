import { Entity } from '../entity';
import { SystemClass } from '../types';
import { World } from '../world';
import { sortByOrder, System } from './system';

export class SystemGroup<E extends Entity = Entity, W extends World<E> = World<E>> {
  public static Name: string = 'Default';

  public order: number;
  public useTopologicalSorting: boolean;

  protected _world: W;
  private _systems: System<E, W>[];

  public constructor(world: W) {
    this.order = 0;
    this.useTopologicalSorting = true;
    this._world = world;
    this._systems = [];
  }

  public add(system: System<E, W>): void {
    // @todo: checks it's not already added.
    this._systems.push(system);
  }

  public tick(delta: number): void {
    const systems = this._systems;
    for (const system of systems) {
      system.tick(delta);
    }
  }

  public sort(): void {
    if (this.useTopologicalSorting) {
      this._sortTopological();
    }
    this._systems.sort(sortByOrder);
  }

  public get world(): World {
    return this._world;
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
