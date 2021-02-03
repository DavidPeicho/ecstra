import { Query, QueryComponents } from './query.js';
import { SystemGroup } from './system-group.js';
import { World } from './world.js';
import { Constructor, EntityOf, SystemClass } from './types';

export abstract class System<WorldType extends World = World> {
  public static Queries?: StaticQueries;
  public static Group?: Constructor<SystemGroup>;
  public static UpdateAfter?: SystemClass[];
  public static UpdateBefore?: SystemClass[];

  public enabled: boolean;
  public order: number;

  protected queries: {
    [key: string]: Query<EntityOf<WorldType>>;
  };

  private _group: SystemGroup<WorldType>;

  public constructor(
    group: SystemGroup<WorldType>,
    options: Partial<SystemOptions<WorldType>>
  ) {
    this.enabled = true;
    this.order = options.order ?? 0;
    this.queries = {};
    this._group = group;

    // @todo: When system is unregistered, how do we clean those queries in
    // the QueryManager?
    this.buildStaticQueries();
  }

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

  public abstract execute(delta: number): void;

  public get group(): SystemGroup {
    return this._group;
  }
}

export function sortByOrder(a: Orderable, b: Orderable): number {
  return a.order - b.order;
}

export interface SystemOptions<WorldType extends World = World> {
  order: number;
}

export interface StaticQueries {
  [key: string]: QueryComponents;
}

export type Orderable = { order: number };
