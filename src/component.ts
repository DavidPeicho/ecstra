import { Property } from './property.js';
import { Constructor, DataComponentClass, Nullable, Option, PropertiesOf } from './types';
import { World } from './world.js';

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

  /** @hidden */
  public _world: Nullable<World>;

  /**
   * @hidden
   */
  public _pooled: boolean;

  /**
   * @hidden
   */
  protected _version: number;

  public constructor() {
    Object.defineProperty(this, 'isComponent', { value: true });
    this._world = null;
    this._pooled = false;
    this._version = 0;
  }

  public update(): this {
    return this;
  }

  /**
   * Returns `true` if the component instance has been created from a component
   * pool. `false` otherwise
   */
  get pooled(): boolean {
    return this._pooled;
  }

  /**
   * Returns the version of the component, i.e., the number related to the
   * last time it's been updated
   */
  get version(): number {
    return this._version;
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

    // Copy default values for properties found in the inheritance hierarchy.
    let Class = this.constructor as DataComponentClass;
    do {
      const staticProps = Class.Properties;
      if (!staticProps) {
        continue;
      }
      for (const name in staticProps) {
        const prop = staticProps[name];
        this[name as keyof this] = prop.cloneDefault();
      }
    } while (
      !!(Class = Object.getPrototypeOf(Class)) &&
      Class !== ComponentData
    );
  }

  /**
   * Copies the `source` argument into this instance. The `source`
   *
   * @param source - Source data to copy into `this` instance. Can be either
   * another component of the same type, or a literal object containing the
   * same properties as the component (mapped to the same types)
   *
   * @return This instance
   */
  public copy(source: PropertiesOf<this>): this {
    const Class = this.constructor as DataComponentClass;
    for (const name in source) {
      const prop = findProperty(Class, name);
      if (prop) {
        const value = source[name as keyof PropertiesOf<this>];
        this[name as keyof this] = prop.copy(this[name as keyof this], value);
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

  public update(): this {
    if (this._world) {
      this._version = this._world.version + 1;
    }
    return this;
  }

  /**
   * Initiliazes the component with its default properties, overriden by
   * the `source`
   *
   * @param source - Source object to feed the component
   * @return This instance
   */
  public init(source: PropertiesOf<this>): this {
    let Class = this.constructor as DataComponentClass;
    do {
      // Copy properties found in the inheritance hierarchy. If the property
      // isn't found in the source, the default value is used.
      const staticProps = Class.Properties;
      if (!staticProps) {
        continue;
      }
      for (const name in staticProps) {
        const prop = staticProps[name];
        if (source.hasOwnProperty(name)) {
          const value = source[name as keyof PropertiesOf<this>];
          this[name as keyof this] = prop.copy(this[name as keyof this], value);
        } else {
          this[name as keyof this] = prop.copyDefault(this[name as keyof this]);
        }
      }
    } while (
      !!(Class = Object.getPrototypeOf(Class)) &&
      Class !== ComponentData
    );

    this._version = 0;

    return this;
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

function findProperty(
  Class: DataComponentClass,
  name: string
): Option<Property<any>> {
  do {
    if (Class.Properties && name in Class.Properties) {
      return Class.Properties[name];
    }
  } while (!!(Class = Object.getPrototypeOf(Class)) && Class !== ComponentData);
  return undefined;
}

export interface Properties {
  [key: string]: Property<any>;
}
