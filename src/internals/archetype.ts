import { Entity } from '../entity.js';
import { ComponentClass } from '../types.js';

export class Archetype {
  public readonly entities: Entity[];
  private readonly _components: Set<ComponentClass>;
  private readonly _hash: string;

  public constructor(components: Set<ComponentClass>, hash: string) {
    this.entities = [];
    this._hash = hash;
    this._components = components;
  }

  public get hash() {
    return this._hash;
  }

  public get components() {
    return this._components;
  }

}
