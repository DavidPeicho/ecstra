import { ComponentData } from './component.js';
import {
  ArrayProp,
  BooleanProp,
  CopyableProp,
  CopyClonableOptions,
  CopyClonableType,
  NumberProp,
  Property,
  RefProp,
  StringProp
} from './property.js';
import {
  DataComponentClass,
  Nullable,
  PropertyClass,
  SystemClass,
  SystemGroupClass
} from './types.js';

/** Properties. */

/**
 * Assigns the given Fecs property to a decorated class property
 *
 * @param property - Fecs property object to assign to the decorated class
 *   property
 * @return A generic property decorator
 *
 * @hidden
 */
function setupProperty(property: Property<unknown>) {
  return function (target: ComponentData, key: string) {
    const constructor = target.constructor as DataComponentClass;
    if (!constructor.Properties) {
      constructor.Properties = {};
    }
    constructor.Properties[key] = property;
  };
}

/**
 * Builds a Fecs property and assign it to a decorated class property.
 *
 * **Notes**: This function is just a healper to construct class with a generic
 * object
 *
 * @param {(PropertyClass | PropertyDecoratorOptions<T>)} options - Option
 *   object to use to setup the property
 * @return A generic property decorator
 */
export function property<T>(
  options: PropertyClass | PropertyDecoratorOptions<T>
) {
  return function (_: ComponentData, key: string) {
    if (typeof options === 'function') {
      setupProperty(new (options as PropertyClass)());
    } else {
      const Class = options.type;
      setupProperty(new Class(options));
    }
  };
}

/**
 * Decorator for a boolean component property
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   boolean(true)
 *   myBoolean!: boolean;
 * }
 * ```
 *
 * @param defaultValue - Default value of the property, used when
 *   the component is initialized
 * @return Decorator for a property storing a boolean value
 */
export function boolean(defaultValue?: boolean) {
  return setupProperty(BooleanProp(defaultValue));
}

/**
 * Decorator for a numeric component property
 *
 * ## Examples
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   number(100)
 *   myNumber!: boolean;
 * }
 * ```
 *
 * @param defaultValue - Default value of the property, used when
 *   the component is initialized
 * @return Decorator for a property storing a number value
 */
export function number(defaultValue?: number) {
  return setupProperty(NumberProp(defaultValue));
}

/**
 * Decorator for a string component property
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   string('This is the default value!')
 *   myString!: boolean;
 * }
 * ```
 *
 * @param defaultValue - Default value of the property, used when
 *   the component is initialized
 * @return Decorator for a property storing a string value
 */
export function string(defaultValue?: string) {
  return setupProperty(StringProp(defaultValue));
}

/**
 * Decorator for an array component property
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   array([ 'This', 'is', 'the', 'default', 'value'])
 *   myArray!: string[];
 * }
 * ```
 *
 * @param defaultValue - Default value of the property, used when
 *   the component is initialized
 * @return Decorator for a property storing an array value
 */
export function array<T>(defaultValue?: T[]) {
  return setupProperty(ArrayProp(defaultValue));
}

/**
 * Decorator for a reference component property
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   ref(null)
 *   myRef!: Vector2 | null;
 * }
 * ```
 *
 * @param defaultValue - Default value of the property, used when
 *   the component is initialized
 * @return Decorator for a property storing a reference value
 */
export function ref<T>(defaultValue?: Nullable<T>) {
  return setupProperty(RefProp(defaultValue));
}

/**
 * Decorator for a reference component property
 *
 * class Vector2() {
 *   static Zero = new Vector2(0, 0);
 *   constructor(x: number, y: number) {
 *     this.x = x;
 *     this.y = y;
 *   }
 *   copy(source: this): this {
 *     this.x = source.x;
 *     this.y = source.y;
 *   }
 *   clone(): Vector2 {
 *     return new (this.constructor)().copy(this);
 *   }
 * }
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   copyable({ type: Vector2, default: new Vector2(0, 0) })
 *   myCopyable!: Vector2;
 * }
 * ```
 *
 * @param defaultValue - Default value of the property, used when
 *   the component is initialized
 * @return Decorator for a property storing a 'copyable' value
 */
export function copyable<T extends CopyClonableType>(
  opts: CopyClonableOptions<T>
) {
  return setupProperty(CopyableProp(opts));
}

export interface PropertyDecoratorOptions<T> {
  type: PropertyClass;
  default?: T;
}

/** Systems. */

/**
 * Decorator to specifiy system classes that should be executed **after**
 * a system
 *
 * ## Examples
 *
 * @before([ SystemThatRunsAfter, ... ])
 * class MySystem extends System {}
 *
 * @param Classes - List of classes that should be executed
 *   **after**
 * @return Decorator for a system class declaration
 */
export function before(Classes: SystemClass[]) {
  return function (constructor: SystemClass) {
    constructor.UpdateBefore = Classes;
  };
}

/**
 * Decorator to specifiy system classes that should be executed **before**
 * a system
 *
 * ## Examples
 *
 * @after([ SystemThatRunsBefore, ... ])
 * class MySystem extends System {}
 *
 * @param Classes - List of classes that should be executed
 *   **before**
 * @return Decorator for a system class declaration
 */
export function after(Classes: SystemClass[]) {
  return function (constructor: SystemClass) {
    constructor.UpdateAfter = Classes;
  };
}

/**
 * Decorator to specifiy the group a system should belong to
 *
 * ## Examples
 *
 * class MyGroup extends SystemGroup {}
 *
 * @group(MyGroup)
 * class MySystem extends System {}
 *
 * @param Class - Group class in which this system should be added
 * @return Decorator for a system class declaration
 */
export function group(Class: SystemGroupClass) {
  return function (constructor: SystemClass) {
    constructor.Group = Class;
  };
}
