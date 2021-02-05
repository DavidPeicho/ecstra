import { Query, QueryComponents } from './query.js';
import { SystemGroup } from './system-group.js';
import { World } from './world.js';
import { Constructor, EntityOf, SystemClass } from './types';

/**
 * Systems query entities based on their components and apply logic to those
 * entities.
 *
 * For instance, a "classic" game would have systems such as:
 *   * PhysicsSystem: looks for entities with component like `RigidBody`,
 *     `Transform`
 *   * RendererSystem: running as the last system of the world, rendering all
 *     meshes based on their transform
 *   * etc...
 *
 * @category system
 */
export abstract class System<WorldType extends World = World> {
  /** Name of the system class */
  public static Name?: string;
  /**
   * List of static queries.
   *
   * Static queries are created when the system is instanciated. For
   * performance reasons, it's better if you use mostly static queries.
   *
   * ## Examples
   *
   * ```js
   * class MySystem extends System {}
   * MySystem.Queries = {
   *   // Query all entities with `MeshComponent` and `TransformComponent`.
   *   mesh: [ MeshComponent, TransformComponent ]
   * }
   *
   *
   * ```
   */
  public static Queries?: StaticQueries;

  /**
   * [[SystemGroup]] class in which this system should be added.
   *
   * **Note**: if no `Group` is specified, the system is added to a default
   * group
   */
  public static Group?: Constructor<SystemGroup>;

  /**
   * List of systems classes that should be executed **before** this system
   *
   * **Note**: this will only affect systems that are in the same group as this
   * one
   */
  public static UpdateAfter?: SystemClass[];

  /**
   * List of systems classes that should be executed **after** this system
   *
   * **Note**: this will only affect systems that are in the same group as this
   * one
   */
  public static UpdateBefore?: SystemClass[];

  /** If `true`, the system will be executed */
  public enabled: boolean;

  /**
   * Order of the system for priority-based sorting. Higher number means that
   * the system will run last
   */
  public order: number;

  /**
   * Queries map built automatically from the `Queries` static list on
   * instantiation of the system
   */
  protected readonly queries: {
    [key: string]: Query<EntityOf<WorldType>>;
  };

  /**
   * Reference to the group holding this system
   *
   * @hidden
   */
  private readonly _group: SystemGroup<WorldType>;

  public constructor(
    group: SystemGroup<WorldType>,
    options: Partial<SystemOptions>
  ) {
    this.enabled = true;
    this.order = options.order ?? 0;
    this.queries = {};
    this._group = group;

    // @todo: When system is unregistered, how do we clean those queries in
    // the QueryManager?
    this.buildStaticQueries();
  }

  /**
   * Builds the static queries from `Queries` into the `queries` attribute of
   * this instance.
   *
   * **Note**: this is a slow operation and should be done **only** if you
   * modify the static list of queries.
   *
   * **Note**: ideally, you should **never** have to modify a static list of
   * queries, **especially** after the system is instanciated
   *
   * @return This instance
   */
  public buildStaticQueries(): this {
    const world = this._group.world;
    const staticQueries = (this.constructor as SystemClass).Queries;
    if (staticQueries) {
      for (const name in staticQueries) {
        const query = staticQueries[name];
        // @todo: should we assign queries in the object or should we just
        // request them using IDs?
        this.queries[name] = world._requestQuery(query);
      }
    }
    return this;
  }

  /**
   * Executes the system, i.e., applies the system logic to the world
   */
  public abstract execute(delta: number): void;

  /** Returns the group in which this system belongs */
  public get group(): SystemGroup {
    return this._group;
  }
}

/**
 * Default priority-based sorting for systems.
 *
 * @hidden
 */
export function sortByOrder(a: Orderable, b: Orderable): number {
  return a.order - b.order;
}

/**
 * Options object to create a system
 */
export interface SystemOptions {
  /**
   * Order of the system for priority-based sorting. Higher number means that
   * the system will run last.
   *
   * Defaults to `0`
   */
  order: number;
}

export interface StaticQueries {
  [key: string]: QueryComponents;
}

export type Orderable = { order: number };
