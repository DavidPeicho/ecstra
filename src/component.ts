export class Component {
  public static readonly Name: string | null = null;
  public readonly isComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });
  }
}

export class TagComponent {
  public static readonly Name: string | null = null;
  public readonly isTagComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isTagComponent', { value: true });
  }
}

export type GenericComponent = Component | TagComponent;
