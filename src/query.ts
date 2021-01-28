import { Entity } from './entity';
import { Archetype } from './internals/archetype';

export class Query {
  private _archetypes: Archetype[];

  public constructor() {
    this._archetypes = [];
  }

  public execute(cb: QueryExecutor): void {
    const archetypes = this._archetypes;
    for (const arch of archetypes) {
      const entities = arch.entities;
      for (const entity of entities) {
        cb(entity);
      }
    }
  }

  public executeUntil(cb: QueryExecutor): void {
    const archetypes = this._archetypes;
    for (const arch of archetypes) {
      const entities = arch.entities;
      for (const entity of entities) {
        if (cb(entity)) {
          return;
        }
      }
    }
  }
}

export type QueryExecutorVoid = (entity: Entity) => void;
export type QueryExecutor = (entity: Entity) => boolean;
