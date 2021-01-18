import { Entity } from './entity';
import { ComponentClass } from './types';

export class Archetype {

  private readonly _components: ComponentClass[];
  private readonly _entities: Entity[];

  public constructor(components: ComponentClass[]) {
    this._components = components;
    this._entities = [];
  }

}

export class Manager {

  private readonly _archetypes: Map<string, Archetype>;

  public constructor() {
    this._archetypes = new Map();
  }

  public updateEntity(entity: Entity): void {

  }

}
