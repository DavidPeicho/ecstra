import { Entity } from '../entity.js';
import { ComponentClass } from '../types.js';
import { World } from '../world.js';
import { Archetype } from './archetype.js';

export class ArchetypeManager {

  private readonly _world: World;
  private readonly _archetypes: Map<string, Archetype>;
  private readonly _emptyHash: string;

  public constructor(world: World) {
    this._archetypes = new Map();
    this._world = world;
    this._emptyHash = '0'.repeat(world['_components'].maxComponentTypeCount);
  }

  public addComponent(entity: Entity, Class: ComponentClass): void {
    // @todo: is it worth to wait another tick to move the entity from the
    // previous to the next archetype?
    this.needArchetypeUpdate(entity, Class);
  }

  public removeComponent(entity: Entity, Class: ComponentClass): void {
    this.needArchetypeUpdate(entity, Class);
  }

  public removeEntity(entity: Entity): void {
    const archetype = entity['_internals'].archetype;
    if (archetype) {
      archetype.entities.splice(archetype.entities.indexOf(entity), 1);
    }
  }

  public needArchetypeUpdate(entity: Entity, Class: ComponentClass): void {
    const compId = this._world['_components'].getIdentifier(Class);

    const prevArchetype = entity['_internals'].archetype as Archetype;
    if (prevArchetype) {
      // Removes from previous archetype
      prevArchetype.entities.splice(prevArchetype.entities.indexOf(entity), 1);
    }

    const prevArchetypeHash = prevArchetype === null ? this._emptyHash : prevArchetype.hash;
    const hashEntry = entity.hasComponent(Class) ? '1' : '0';
    const newArchetypeHash = buildHash(prevArchetypeHash, hashEntry, compId);

    if (!this._archetypes.has(newArchetypeHash)) {
      const archetype = new Archetype(newArchetypeHash);
      this._archetypes.set(newArchetypeHash, archetype);
    }

    const archetype = this._archetypes.get(newArchetypeHash)!;
    archetype.entities.push(entity);
  }

}

function buildHash(prevHash: string, entry: string, index: number) {
  return `${prevHash.substring(0, index)}${entry}${prevHash.substring(index + 1)}`;
}
