import { Entity } from '../entity.js';

export class Archetype {
  public readonly entities: Entity[];
  private readonly _hash: string;

  public constructor(hash: string) {
    this.entities = [];
    this._hash = hash;
  }

  public get hash() {
    return this._hash;
  }
}
