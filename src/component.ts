import { Property } from './property.js';
import { Nullable } from './types';

export class Component<CompClass extends typeof Component = typeof Component> {
  public static readonly Name: Nullable<string> = null;
  public static readonly Properties?: Properties;
  public readonly isComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });

    const properties = (this.constructor as CompClass).Properties;
    for (const name in properties) {
      this[name as keyof this] = properties[name].cloneDefault();
    }
  }

  public copy(source: PropertiesOf<this>, useDefault = false): this {
    const properties = (this.constructor as CompClass).Properties;
    // @todo: inverse loop, should loop on source instead.
    for (const name in properties) {
      if (source.hasOwnProperty(name)) {
        const prop = properties[name];
        const value = source[name as keyof this];
        this[name as keyof this] = prop.copy(value, this[name as keyof this]);
      }
    }
    return this;
  }

  public clone(source: this): this {
    const Class = (this.constructor as CompClass);
    return (new Class() as this).copy(source);
  }

  public init(source: PropertiesOf<this>): this {
    return this.copy(source, true);
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

export type PropertiesOf<CompType extends Component> = {
  [ K in keyof CompType ]: any;
};

export interface Properties {
  [ key: string ]: Property<any>;
}
export type GenericComponent = Component | TagComponent;
