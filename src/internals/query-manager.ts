import { ComponentOperator, Query, QueryComponents } from '../query.js';
import { World } from '../world.js';
import { Archetype } from './archetype.js';
import { ComponentClass, EntityOf } from '../types';

export class QueryManager<WorldType extends World> {
  private _world: WorldType;
  private _queries: Map<string, Query<EntityOf<WorldType>>>;

  public constructor(world: WorldType) {
    this._world = world;
    this._queries = new Map();
  }

  public request(components: QueryComponents): Query<EntityOf<WorldType>> {
    const id = this._getQueryIdentifier(components);
    if (!this._queries.has(id)) {
      // @todo: what happens when a system is unregistered?
      // @todo: will not work if a system is created after some
      // archetypes already exist.
      const query = new Query<EntityOf<WorldType>>(components);
      this._queries.set(id, query);
      this._world._onQueryCreated(query);
    }
    return this._queries.get(id)!;
  }

  public addArchetypeToQuery(query: Query<EntityOf<WorldType>>, archetype: Archetype<EntityOf<WorldType>>): void {
    if (query.matches(archetype)) {
      query['_archetypes'].push(archetype);
    }
  }

  public removeArchetypeFromQuery(query: Query<EntityOf<WorldType>>, archetype: Archetype<EntityOf<WorldType>>): void {
    if (query.matches(archetype)) {
      const archetypes = query['_archetypes'];
      const index = archetypes.indexOf(archetype);
      if (index >= 0) {
        archetypes.splice(index, 1);
      }
    }
  }

  public addArchetype(archetype: Archetype<EntityOf<WorldType>>): void {
    const queries = this._queries;
    // @todo: how to optimize that when a lot of archetypes are getting created?
    for (const [_, query] of queries) {
      this.addArchetypeToQuery(query, archetype);
    }
  }

  public removeArchetype(archetype: Archetype<EntityOf<WorldType>>): void {
    const queries = this._queries;
    // @todo: how to optimize that when a lot of archetypes are getting destroyed?
    for (const [_, query] of queries) {
      this.removeArchetypeFromQuery(query, archetype);
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
