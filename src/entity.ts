import { Archetype } from './internals/archetype';
import { GenericComponent } from './component';
import { ComponentClass, Nullable, Option } from './types';
import { World } from './world';

export enum Accessor {
  Read = 'read',
  Write = 'write'
}

export class Entity<W extends World = World> {
  public readonly id!: string;

  public readonly _components: Map<ComponentClass, GenericComponent>;
  private readonly _internals: EntityInternals<W>;

  public constructor(world: W, id: string) {
    this.id = id;
    this._components = new Map();
    this._internals = { archetype: null, world };
  }

  public destroy(): void {
    this._internals.world['_destroyEntity'](this);
  }

  public addComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): this {
    // @todo: check in dev mode for duplicate.
    // this._components.set(Class, comp);
    this._internals.world['_addComponent'](this, Class);
    return this;
  }

  public removeComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): this {
    // @todo: check in dev mode for non-existing comp.
    if (this._components.has(Class)) {
      this._internals.world['_removeComponent'](this, Class);
      this._components.delete(Class);
    }
    return this;
  }

  public getComponent<T extends GenericComponent>(
    Class: ComponentClass<T>,
    accessor?: Accessor
  ): Option<T> {
    return this._components.get(Class) as Option<T>;
  }

  public getOrCreateComponent<T extends GenericComponent>(
    Class: ComponentClass<T>
  ): T {
    if (!this.hasComponent) {
      this.addComponent(Class);
    }
    return this.getComponent(Class)!;
  }

  public hasComponent(Class: ComponentClass): boolean {
    return this._components.has(Class);
  }
}

type EntityInternals<WorldType> = {
  archetype: Nullable<Archetype>;
  world: WorldType;
};
