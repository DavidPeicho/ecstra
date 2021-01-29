import { Entity } from './entity';
import { Archetype } from './internals/archetype';
import { ComponentClass } from './types';

enum QueryComponentOperatorKind {
  Not = 'not',
  Optional = 'optional'
}

export function Not(Class: ComponentClass) {
  return { Class, kind: QueryComponentOperatorKind.Not, isOperator: true };
}

export class Query<E extends Entity> {
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
        this._classes.push((comp as ComponentClass));
      }
    }
  }

  public execute(cb: QueryExecutorVoid): void {
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
}

export type ComponentOperator = {
  Class: ComponentClass;
  kind: QueryComponentOperatorKind;
  isOperator: true;
};
export type QueryComponents = (ComponentClass | ComponentOperator)[];
export type QueryExecutorVoid = (entity: Entity) => void;
export type QueryExecutor = (entity: Entity) => boolean;
