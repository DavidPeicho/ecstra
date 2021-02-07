import { Entity } from './entity.js';
import { Archetype } from './internals/archetype.js';
import { ComponentClass, Option } from './types';

enum QueryComponentOperatorKind {
  Not = 'not'
}

export function Not(Class: ComponentClass) {
  return { Class, kind: QueryComponentOperatorKind.Not, isOperator: true };
}

/**
 * Queries allow to retrieve entities based on the component they have.
 *
 * Flecs query language can perform the following operations:
 *   * Intersection of component (&)
 *   * Negation (!)
 *
 * **Notes**: using this class as a standalone will not work because the
 * world populates tempory data into the query.
 *
 * @category query
 */
export class Query<E extends Entity = Entity> {
  /** @hidden */
  private readonly _hash: string;

  /** @hidden */
  private _archetypes: Archetype<E>[];

  /** @hidden */
  private _classes: ComponentClass[];

  /** @hidden */
  private _notClasses: ComponentClass[];

  public constructor(hash: string, components: QueryComponents) {
    this._hash = hash;
    this._archetypes = [];
    this._classes = [];
    this._notClasses = [];
    for (const comp of components) {
      if ((comp as ComponentOperator).isOperator) {
        this._notClasses.push((comp as ComponentOperator).Class);
      } else {
        this._classes.push(comp as ComponentClass);
      }
    }
  }

  /**
   * Executes the callback on all entities matching this query
   *
   * @param cb - Callback executing on every entity
   */
  public execute(cb: QueryExecutorVoid): void {
    const archetypes = this._archetypes;
    for (let archId = archetypes.length - 1; archId >= 0; --archId) {
      const entities = archetypes[archId].entities;
      for (let entityId = entities.length - 1; entityId >= 0; --entityId) {
        cb(entities[entityId]);
      }
    }
  }

  /**
   * Executes the callback on all entities matching this query. If the callback
   * returns `true` at any point, iteration will stop
   *
   * @param cb - Callback executing on every entity
   */
  public executeUntil(cb: QueryExecutor): void {
    const archetypes = this._archetypes;
    for (let archId = archetypes.length - 1; archId >= 0; --archId) {
      const entities = archetypes[archId].entities;
      for (let entityId = entities.length - 1; entityId >= 0; --entityId) {
        if (cb(entities[entityId])) {
          return;
        }
      }
    }
  }

  /**
   * Returns true if this query definition matches the given archetype
   *
   * @param archetype - Archetype to test
   * @return `true` if a match occurs, `false` otherwise
   */
  public matches(archetype: Archetype<E>): boolean {
    const notClasses = this._notClasses;
    for (const not of notClasses) {
      if (archetype.components.has(not)) {
        return false;
      }
    }
    const classes = this._classes;
    for (const comp of classes) {
      if (!archetype.components.has(comp)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns `true` if this query has the entity `entity`
   *
   * @param entity - Entity to check
   * @return `true` if the entity matches this query, false otherwise
   */
  public hasEntity(entity: E): boolean {
    for (const archetype of this._archetypes) {
      if (archetype.hasEntity(entity)) {
        return true;
      }
    }
    return false;
  }

  public get first(): Option<E> {
    const archetypes = this._archetypes;
    if (archetypes.length > 0 && archetypes[0].entities.length > 0) {
      return archetypes[0].entities[0];
    }
    return undefined;
  }

  /** Returns the list archetypes stored in this query */
  public get archetypes(): Archetype<E>[] {
    return this._archetypes;
  }

  public get hash(): string {
    return this._hash;
  }
}

export type ComponentOperator = {
  Class: ComponentClass;
  kind: QueryComponentOperatorKind;
  isOperator: boolean;
};
export type QueryComponents = (ComponentClass | ComponentOperator)[];
export type QueryExecutorVoid = (entity: Entity) => void;
export type QueryExecutor = (entity: Entity) => boolean;
