import { process } from './constants';
import { Entity } from './entity';
import { createUUID } from './utils';

export class World {

  private _entities: Map<string, Entity>;

  public constructor() {
    this._entities = new Map();
  }

  public create(id?: string): Entity {
    id = id ?? createUUID();
    if (process.env.NODE_ENV === 'development') {
      if (this._entities.has(id)) {
        throw new Error(`found duplicated entity with id: '${id}'`);
      }
    }
    const entity = new Entity(id);
    this._entities.set(id, entity);
    return entity;
  }

}
