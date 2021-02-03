import { Entity } from './entity.js';
import { Archetype } from './internals/archetype.js';
import { ComponentClass } from './types';

enum QueryComponentOperatorKind {
  Not = 'not'
}

export function Not(Class: ComponentClass) {
  return { Class, kind: QueryComponentOperatorKind.Not, isOperator: true };
}

export class Query<E extends Entity = Entity> {
  private _archetypes: Archetype<E>[];
  private _classes: ComponentClass[];
  private _notClasses: ComponentClass[];

  public constructor(components: QueryComponents) {
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

  public execute(cb: QueryExecutorVoid): void {
    const archetypes = this._archetypes;
    for (let archId = archetypes.length - 1; archId >= 0; --archId) {
      const entities = archetypes[archId].entities;
      for (let entityId = entities.length - 1; entityId >= 0; --entityId) {
        cb(entities[entityId]);
      }
    }
  }

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

  public hasEntity(entity: E): boolean {
    for (const archetype of this._archetypes) {
      if (archetype.hasEntity(entity)) {
        return true;
      }
    }
    return false;
  }

  public get archetypes(): Archetype<E>[] {
    return this._archetypes;
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
