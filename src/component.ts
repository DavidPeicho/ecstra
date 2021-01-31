import { Property } from './property.js';
import { DataComponentClass, PropertiesOf } from './types';

export enum ComponentState {
  None = 0,
  Added = 1,
  Ready = 2,
  Removed = 3
}

export class Component {
  public static readonly Name?: string;
  public readonly isComponent!: true;

  private _state: ComponentState;
  private _pooled: boolean;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });
    this._state = ComponentState.None;
    this._pooled = false;
  }

  get state(): ComponentState {
    return this._state;
  }

  get pooled(): boolean {
    return this._pooled;
  }
}

export class DataComponent extends Component {
  public static readonly Properties?: Properties;
  public readonly isDataComponent!: true;

  public constructor() {
    super();
    Object.defineProperty(this, 'isDataComponent', { value: true });
    const properties = this._getClass().Properties;
    for (const name in properties) {
      this[name as keyof this] = properties[name].cloneDefault();
    }
  }

  public copy(source: PropertiesOf<this>, useDefault = false): this {
    const properties = this._getClass().Properties;
    for (const name in properties) {
      const prop = properties[name];
      if (source.hasOwnProperty(name)) {
        const value = source[name as keyof PropertiesOf<this>];
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

  private _getClass(): DataComponentClass<this> {
    return this.constructor as DataComponentClass<this>;
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

export class TagComponent extends Component {
  public readonly isTagComponent!: true;
  public constructor() {
    super();
    Object.defineProperty(this, 'isTagComponent', { value: true });
  }
}

export interface Properties {
  [ key: string ]: Property<any>;
}
