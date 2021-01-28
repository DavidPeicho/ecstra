import { ComponentClass, Nullable } from './types';

export class Component {
  public static readonly Name: Nullable<string> = null;
  public readonly isComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });
  }

  public copy(source: this): this {
    return this;
  }
}

export class TagComponent {
  public static readonly Name: string | null = null;
  public readonly isTagComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isTagComponent', { value: true });
  }
}

// @todo: up to one component per world on a dummy entity.
export class SingletonComponent {}

export type GenericComponent = Component | TagComponent;
