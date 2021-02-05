import { Property } from './property.js';
import { Constructor, DataComponentClass, PropertiesOf } from './types';

export enum ComponentState {
  None = 0,
  Added = 1,
  Ready = 2,
  Removed = 3
}

/**
 * Base class for a component.
 *
 * Components are attached to entity and are used as a source of inputs.
 * Components should only contain data and no logic
 *
 * @category components
 */
export abstract class Component {
  /** Name of the component class */
  public static readonly Name?: string;
  /** `true` if the object instance derives from [[Component]] */
  public readonly isComponent!: true;

  /**
   * @hidden
   */
  public _state: ComponentState;

  /**
   * @hidden
   */
  public _pooled: boolean;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });
    this._state = ComponentState.None;
    this._pooled = false;
  }

  /**
   * This is useless for now.
   */
  get state(): ComponentState {
    return this._state;
  }

  /**
   * Returns `true` if the component instance has been created from a component
   * pool. `false` otherwise
   */
  get pooled(): boolean {
    return this._pooled;
  }
}

/**
 * Component holding data feeding entity: number, string, reference, etc...
 *
 * This must be the most common component type you are going to need.
 *
 * ComponentData list static roperties they expect to deal with. Using static
 * properties allow seemless creation of component classes, and simplify the
 * process of copy and re-initialization of components.
 *
 * If you wish to create a component holding data, but without using static
 * properties, please create your own class deriving from [[Component]].
 *
 * ## Usage
 *
 * ```js
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   bool: BooleanProp(true),
 *   number: NumberProp(100)
 * };
 * ```
 *
 * ## Decorators
 *
 * ```ts
 * class TestComponentDecorator extends ComponentData {
 *   @boolean(true)
 *   bool!: boolean;
 *
 *   @number(100)
 *   number!: number;
 * }
 * ```
 *
 * @category components
 */
export class ComponentData extends Component {
  /**
   * Component schema.
   *
   * This should list all the data the component will host
   */
  public static readonly Properties?: Properties;

  /** `true` if the instance derives from the [[ComponentData]] class */
  public readonly isDataComponent!: true;

  public constructor() {
    super();
    Object.defineProperty(this, 'isDataComponent', { value: true });
    const properties = (this.constructor as DataComponentClass).Properties;
    for (const name in properties) {
      this[name as keyof this] = properties[name].cloneDefault();
    }
  }

  /**
   * Copies the `source` argument into this instance. The `source`
   *
   * @param source - Source data to copy into `this` instance. Can be either
   * another component of the same type, or a literal object containing the
   * same properties as the component (mapped to the same types)
   * @param useDefault - If `true`, missing properties from the source object
   *   will be reset to their default value specified in the static properties
   *   list
   * @return This instance
   */
  public copy(source: PropertiesOf<this>, useDefault = false): this {
    const properties = (this.constructor as DataComponentClass).Properties;
    for (const name in properties) {
      const prop = properties[name];
      if (source.hasOwnProperty(name)) {
        const value = source[name as keyof PropertiesOf<this>];
        this[name as keyof this] = prop.copy(this[name as keyof this], value);
      } else if (useDefault) {
        this[name as keyof this] = prop.copyDefault(this[name as keyof this]);
      }
    }
    return this;
  }

  /**
   * Returns a new instance set to the same values as `this`
   *
   * @returns A clone of `this` instance
   */
  public clone(): this {
    return new (this.constructor as Constructor<this>)().copy(this);
  }

  /**
   * Initiliazes the component with its default properties, overriden by
   * the `source`
   *
   * @param source - Source object to feed the component
   * @return This instance
   */
  public init(source: PropertiesOf<this>): this {
    return this.copy(source, true);
  }
}

// @todo: up to one component per world on a dummy entity.
export class SingletonComponent extends ComponentData {
  public readonly isSingletonComponent!: true;
  public constructor() {
    super();
    Object.defineProperty(this, 'isSingletonComponent', { value: true });
  }
}

/**
 * Component used only to tag entities. [[TagComponent]] do not hold any data
 *
 * @category components
 */
export class TagComponent extends Component {
  /** `true` if the instance derives from the [[TagComponent]] class */
  public readonly isTagComponent!: true;

  public constructor() {
    super();
    Object.defineProperty(this, 'isTagComponent', { value: true });
  }
}

export interface Properties {
  [key: string]: Property<any>;
}
