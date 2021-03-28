import { Observable } from '../data/observer.js';
import { Entity } from '../entity.js';
import { ComponentClass } from '../types';

export class Archetype<E extends Entity> {
  public readonly entities: E[];

  private readonly _components: Set<ComponentClass>;
  private readonly _hash: string;
  private readonly _onEntityAdded: Observable<E>;
  private readonly _onEntityRemoved: Observable<E>;

  public constructor(components: ComponentClass[], hash: string) {
    this.entities = [];
    this._hash = hash;
    this._components = new Set(components);
    this._onEntityAdded = new Observable();
    this._onEntityRemoved = new Observable();
  }

  public add(entity: E): void {
    entity._indexInArchetype = this.entities.length;
    entity._archetype = this;
    this.entities.push(entity);
    this._onEntityAdded.notify(entity);
  }

  public remove(entity: E): void {
    const entities = this.entities;
    // Move last entity to removed location.
    if (entities.length > 1) {
      const last = entities[entities.length - 1];
      last._indexInArchetype = entity._indexInArchetype;
      entities[entity._indexInArchetype] = last;
      entities.pop();
    } else {
      entities.length = 0;
    }
    entity._archetype = null;
    entity._indexInArchetype = -1;
    this._onEntityRemoved.notify(entity);
  }

  public hasEntity(entity: E): boolean {
    return this.entities.indexOf(entity) >= 0;
  }

  public get hash(): string {
    return this._hash;
  }

  public get components(): Set<ComponentClass> {
    return this._components;
  }

  public get empty(): boolean {
    return this.entities.length === 0;
  }

  public get onEntityAdded(): Observable<E> {
    return this._onEntityAdded;
  }

  public get onEntityRemoved(): Observable<E> {
    return this._onEntityRemoved;
  }
}
