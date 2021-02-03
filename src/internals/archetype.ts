import { Entity } from '../entity.js';
import { ComponentClass } from '../types';

export class Archetype<E extends Entity> {
  public readonly entities: E[];
  private readonly _components: Set<ComponentClass>;
  private readonly _hash: string;

  public constructor(components: ComponentClass[], hash: string) {
    this.entities = [];
    this._hash = hash;
    this._components = new Set(components);
  }

  public hasEntity(entity: E): boolean {
    return this.entities.indexOf(entity) >= 0;
  }

  public get hash() {
    return this._hash;
  }

  public get components() {
    return this._components;
  }
}
