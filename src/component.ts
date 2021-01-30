import { Property } from './property.js';
import { ComponentClass } from './types';

export class Component {
  public static readonly Name?: string;
  public static readonly Properties?: Properties;
  public readonly isComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });

    const properties = this._getClass().Properties;
    for (const name in properties) {
      this[name as keyof this] = properties[name].cloneDefault();
    }
  }

  public copy(source: PropertiesOf<this>, useDefault = false): this {
    const properties = this._getClass().Properties;
    // @todo: inverse loop, should loop on source instead.
    for (const name in properties) {
      const prop = properties[name];
      if (source.hasOwnProperty(name)) {
        const value = source[name as keyof this];
        this[name as keyof this] = prop.copy(value, this[name as keyof this]);
      } else if (useDefault) {
        this[name as keyof this] = prop.copyDefault(this[name as keyof this]);
      }
    }
    return this;
  }

  public clone(source: this): this {
    const Class = this._getClass();
    return (new Class() as this).copy(source);
  }

  public init(source: PropertiesOf<this>): this {
    return this.copy(source, true);
  }

  private _getClass(): ComponentClass<this> {
    return this.constructor as ComponentClass<this>;
  }

}

// @todo: up to one component per world on a dummy entity.
export class SingletonComponent extends Component {
  public readonly isSingletonComponent!: true;
  public constructor() {
    super();
    Object.defineProperty(this, 'isSingletonComponent', { value: true });
  }
}

export class TagComponent {
  public static readonly Name?: string;

  public readonly isTagComponent!: true;

  public constructor() {
    Object.defineProperty(this, 'isTagComponent', { value: true });
  }
}

export type PropertiesOf<CompType extends Component> = {
  [ K in keyof CompType ]: any;
};

export interface Properties {
  [ key: string ]: Property<any>;
}
export type GenericComponent = Component | TagComponent;
