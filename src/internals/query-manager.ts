import { ComponentOperator, Query, QueryComponents } from '../query';
import { ComponentClass } from '../types';
import { World } from '../world';
import { Archetype } from './archetype';

export class QueryManager<W extends World = World> {
  private _world: W;
  private _queries: Map<string, Query>;

  public constructor(world: W) {
    this._world = world;
    this._queries = new Map();
  }

  public request(components: QueryComponents): Query {
    // Registers components if needed.
    // @todo: move in world to regroup those behaviours that create side effects.
    for (const comp of components) {
      const Class = (comp as ComponentOperator).isOperator ? (comp as ComponentOperator).Class : comp as ComponentClass;
      this._world['_registerComponent'](Class);
    }
    const id = this._getQueryIdentifier(components);
    if (!this._queries.has(id)) {
      // @todo: what happens when a system is unregistered?
      const query = new Query(components);
      this._queries.set(id, query);
    }
    return this._queries.get(id)!;
  }

  public addArchetype(archetype: Archetype): void {
    const queries = this._queries;
    for (const [ _, query ] of queries) {
      if (query.matches(archetype)) {
        query['_archetypes'].push(archetype);
      }
    }
  }

  public removeArchetype(archetype: Archetype): void {
  }

  private _getQueryIdentifier(components: QueryComponents): string {
    const count = components.length;
    const idList = new Array(count);
    for (let i = 0; i < count; ++i) {
      // @todo: move somewhere else
      const comp = components[i];
      const Class = (comp as ComponentOperator).isOperator ? (comp as ComponentOperator).Class : comp as ComponentClass;
      const compId = this._world['_components'].getIdentifier(Class);
      if ((comp as ComponentOperator).isOperator) {
        idList[i] = `${(comp as ComponentOperator).kind}(${compId})`;
      } else {
        idList[i] = compId + '';
      }
    }
    return idList.sort().join('_');
  }
}
