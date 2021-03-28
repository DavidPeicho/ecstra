import { ComponentOperator, Query, QueryComponents } from '../query.js';
import { World } from '../world.js';
import { Archetype } from './archetype.js';
import { ComponentClass, EntityOf } from '../types';
import { Observer } from '../data/observer.js';

export class QueryManager<WorldType extends World> {
  private _world: WorldType;
  private _queries: Map<string, QueryCache<WorldType>>;

  public constructor(world: WorldType) {
    this._world = world;
    this._queries = new Map();
  }

  public request(components: QueryComponents): Query<EntityOf<WorldType>> {
    const hash = this._getQueryIdentifier(components);
    if (!this._queries.has(hash)) {
      // @todo: what happens when a system is unregistered?
      // @todo: will not work if a system is created after some
      // archetypes already exist.
      const query = new Query<EntityOf<WorldType>>(hash, components);
      this._queries.set(hash, { query, useCount: 0 });
      this._world._onQueryCreated(query);
    }
    const cache = this._queries.get(hash)!;
    cache.useCount++;
    return cache.query;
  }

  public release(query: Query<EntityOf<WorldType>>): void {
    // @todo: ref count could be moved in Query directly, but that doesn't
    // fully makes sense semantically.
    const cache = this._queries.get(query.hash);
    if (!cache) {
      return;
    }
    if (--cache.useCount === 0) {
      // Query isn't used anymore by systems. It can safely be removed.
      this._queries.delete(query.hash);
    }
  }

  public addArchetypeToQuery(
    query: Query<EntityOf<WorldType>>,
    archetype: Archetype<EntityOf<WorldType>>
  ): void {
    if (!query.matches(archetype)) {
      return;
    }
    const addedObs = new Observer(query._notifyEntityAdded.bind(query));
    addedObs.id = query.hash;
    const removedObs = new Observer(query._notifyEntityRemoved.bind(query));
    removedObs.id = query.hash;

    archetype.onEntityAdded.observe(addedObs);
    archetype.onEntityRemoved.observe(removedObs);
    query['_archetypes'].push(archetype);
  }

  public removeArchetypeFromQuery(
    query: Query<EntityOf<WorldType>>,
    archetype: Archetype<EntityOf<WorldType>>
  ): void {
    if (query.matches(archetype)) {
      const archetypes = query['_archetypes'];
      const index = archetypes.indexOf(archetype);
      if (index >= 0) {
        archetype.onEntityAdded.unobserveId(query.hash);
        archetype.onEntityRemoved.unobserveId(query.hash);
        archetypes.splice(index, 1);
      }
    }
  }

  public addArchetype(archetype: Archetype<EntityOf<WorldType>>): void {
    const queries = this._queries;
    // @todo: how to optimize that when a lot of archetypes are getting created?
    for (const [_, cache] of queries) {
      // @todo: ref count could be moved in Query directly, but that doesn't
      // fully makes sense semantically.
      this.addArchetypeToQuery(cache.query, archetype);
    }
  }

  public removeArchetype(archetype: Archetype<EntityOf<WorldType>>): void {
    const queries = this._queries;
    // @todo: how to optimize that when a lot of archetypes are getting destroyed?
    for (const [_, cache] of queries) {
      // @todo: ref count could be moved in Query directly, but that doesn't
      // fully makes sense semantically.
      this.removeArchetypeFromQuery(cache.query, archetype);
    }
  }

  private _getQueryIdentifier(components: QueryComponents): string {
    const count = components.length;
    const idList = new Array(count);
    for (let i = 0; i < count; ++i) {
      // @todo: move somewhere else
      const comp = components[i];
      const Class = (comp as ComponentOperator).isOperator
        ? (comp as ComponentOperator).Class
        : (comp as ComponentClass);
      const compId = this._world.getComponentId(Class);
      if ((comp as ComponentOperator).isOperator) {
        idList[i] = `${(comp as ComponentOperator).kind}(${compId})`;
      } else {
        idList[i] = compId + '';
      }
    }
    return idList.sort().join('_');
  }
}

type QueryCache<WorldType> = {
  query: Query<EntityOf<WorldType>>;
  useCount: number;
};
