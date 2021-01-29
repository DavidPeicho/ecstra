import { Entity } from '../entity.js';
import { ComponentClass } from '../types.js';
import { World } from '../world.js';
import { Archetype } from './archetype.js';

export class ArchetypeManager<E extends Entity, W extends World<E> = World<E>> {
  private readonly _world: W;
  private readonly _archetypes: Map<string, Archetype<E>>;
  private readonly _emptyHash: string;

  public constructor(world: W) {
    this._archetypes = new Map();
    this._world = world;
    this._emptyHash = '0'.repeat(world.maxComponentTypeCount);
  }

  public addComponent(entity: E, Class: ComponentClass): void {
    // @todo: is it worth to wait another tick to move the entity from the
    // previous to the next archetype?
    this.needArchetypeUpdate(entity, Class);
  }

  public removeComponent(entity: E, Class: ComponentClass): void {
    this.needArchetypeUpdate(entity, Class);
  }

  public removeEntity(entity: Entity): void {
    const archetype = entity.archetype;
    if (archetype) {
      archetype.entities.splice(archetype.entities.indexOf(entity), 1);
      entity['_archetype'] = null;
    }
  }

  public needArchetypeUpdate(entity: E, Class: ComponentClass): void {
    const compId = this._world['_components'].getIdentifier(Class);

    const prevArchetype = entity.archetype;
    if (prevArchetype) {
      // Removes from previous archetype
      prevArchetype.entities.splice(prevArchetype.entities.indexOf(entity), 1);
    }

    const prevArchetypeHash =
      prevArchetype === null ? this._emptyHash : prevArchetype.hash;
    const hashEntry = entity.hasComponent(Class) ? '1' : '0';
    const newArchetypeHash = buildHash(prevArchetypeHash, hashEntry, compId);

    if (!this._archetypes.has(newArchetypeHash)) {
      const archetype = new Archetype<E>(newArchetypeHash);
      this._archetypes.set(newArchetypeHash, archetype);
    }

    const archetype = this._archetypes.get(newArchetypeHash)!;
    archetype.entities.push(entity);
  }
}

function buildHash(prevHash: string, entry: string, index: number) {
  return `${prevHash.substring(0, index)}${entry}${prevHash.substring(
    index + 1
  )}`;
}
