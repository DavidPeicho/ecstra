import { Entity } from '../entity';
import { Query, QueryComponents } from '../query';
import { Constructor, SystemClass } from '../types';
import { World } from '../world';
import { SystemGroup } from './system-group';

export abstract class System<E extends Entity = Entity, W extends World<E> = World<E>> {
  public static readonly queries?: StaticQueries;
  public static readonly group?: Constructor<SystemGroup>;
  public static readonly updateAfter?: SystemClass[];
  public static readonly updateBefore?: SystemClass[];

  public enabled: boolean;
  public order: number;
  public topologicalOrder: number;

  protected queries: {
    [ key: string ]: Query<E>;
  };

  private _group: SystemGroup<E, W>;

  public constructor(options: SystemOptions<E, W>) {
    this.enabled = true;
    this.order = 0;
    this.topologicalOrder = 0;
    this.queries = {};
    this._group = options.group;

    // @todo: When system is unregistered, how do we clean those queries in
    // the QueryManager?
    this.buildStaticQueries();
  }

  public buildStaticQueries(): this {
    const world = this._group.world;
    const staticQueries = (this.constructor as SystemClass).queries;
    if (staticQueries) {
      for (const name in staticQueries) {
        const query = staticQueries[name];
        // @todo: should we assign queries in the object or should we just
        // request them using IDs?
        this.queries[name] = world['_requestQuery'](query);
      }
    }
    return this;
  }

  public abstract tick(delta: number): void;
}

export function sortByOrder(a: Orderable, b: Orderable): number {
  return a.order - b.order;
}

export interface SystemOptions<E extends Entity, W extends World<E>> {
  group: SystemGroup<E, W>;
  params: any;
}

export interface StaticQueries {
  [key: string]: QueryComponents;
};

export type Orderable = { order: number };