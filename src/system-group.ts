import { World } from './world.js';
import { sortByOrder, System } from './system.js';
import { SystemClass } from './types';

/**
 * A SystemGroup is used to group systems together. Systems belonging to the
 * same group can be sorted relative to each other.
 *
 * Groups allow to execute logic at different stage. For instance, it's common
 * to first update all the transforms, and then to render all objects. Groups
 * can help for those use cases as they will clearly help to separate the
 * execution into main steps:
 *   * Update
 *     * System1
 *     * ...
 *     * SystemN
 *   * Render
 *     * System1
 *     * ...
 *     * SystemN
 *
 * Using groups, it's also easier for developers to share systems to other
 * developers and keep a consistent default ordering
 *
 * @category system
 */
export class SystemGroup<WorldType extends World = World> {
  /** Name of the system group class */
  public static Name?: string;

  /**
   * If `true`, the system group will be executed
   *
   * When a group is disabled, none of its systems will be executed
   */
  public enabled: boolean;

  /**
   * Order of the group for priority-based sorting. Higher number means that
   * the group will run last
   */
  public order: number;

  /** If `true`, systems will be sorted first using topological sorting */
  public useTopologicalSorting: boolean;

  /**
   * @hidden
   */
  protected readonly _world: WorldType;

  /**
   * @hidden
   */
  private _systems: System<WorldType>[];

  public constructor(world: WorldType) {
    this.enabled = true;
    this.order = 0;
    this.useTopologicalSorting = true;
    this._world = world;
    this._systems = [];
  }

  /**
   * Adds the given system to this group.
   *
   * **Note**: users **should'nt** call this method manually
   *
   * @hidden
   */
  public add(system: System<WorldType>): void {
    // @todo: checks it's not already added.
    this._systems.push(system);
  }

  /**
   * Executes the group, i.e., executes all its systems sequentially
   */
  public execute(delta: number): void {
    const systems = this._systems;
    for (const system of systems) {
      if (system.enabled) {
        system.execute(delta);
      }
    }
  }

  /**
   * Sorts the systems topologically first, and then based on the `order` they
   * define.
   *
   * **Note**: if the group property `useTopologicalSorting` is set to `false`,
   * no topological sorting will occur
   */
  public sort(): void {
    if (this.useTopologicalSorting) {
      this._sortTopological();
    }
    this._systems.sort(sortByOrder);
  }

  /**
   * @hidden
   */
  private _sortTopological(): void {
    const nodes = new Map<SystemClass, Node>();
    const systems = this._systems;

    for (const system of systems) {
      // @todo: check for duplicate.
      const Class = system.constructor as SystemClass;
      nodes.set(Class, { next: [], system, visited: false });
    }
    for (const [Class, node] of nodes) {
      if (Class.UpdateAfter) {
        for (const AfterClass of Class.UpdateAfter) {
          nodes.get(AfterClass)?.next.push(Class);
        }
      }
      if (Class.UpdateBefore) {
        for (const BeforeClass of Class.UpdateBefore) {
          if (nodes.has(BeforeClass)!) {
            node.next.push(BeforeClass);
          }
        }
      }
    }
    // @todo: use indices instead of changing lenght.
    systems.length = 0;
    nodes.forEach((node) => {
      const Class = node.system.constructor as SystemClass;
      topologicalSortRec(systems, Class, nodes);
    });
  }

  /** Returns the reference to the [[World]] holding this group */
  public get world(): WorldType {
    return this._world;
  }

  public get isEmpty(): boolean {
    return this._systems.length === 0;
  }

  /**
   * @param {System} system
   *
   * @hidden
   */
  public _remove(system: System<WorldType>): void {
    this._systems.splice(this._systems.indexOf(system), 1);
  }
}

/**
 * @hidden
 */
function topologicalSortRec(
  result: System[],
  Class: SystemClass,
  visited: Map<SystemClass, Node>
): void {
  const node = visited.get(Class)!;
  if (!node || node.visited) {
    return;
  }
  node.visited = true;
  for (const next of node.next) {
    topologicalSortRec(result, next, visited);
  }
  result.unshift(node.system);
}

/** @hidden */
type Node = {
  next: SystemClass[];
  visited: boolean;
  system: System;
};
