import { Constructor, Nullable } from './types';

/**
 * Generic component property.
 *
 * Properties are on [[ComponentData]] objects. Properties should be defined
 * statically, and allow component to be copied and initialized easily
 *
 * @class property
 */
export class Property<T> {
  /**
   * Default value of the property. The default value is used when the
   * component is initialized if no value for this property is provided
   */
  public default: T;

  public constructor(typeDefault: T, defaultVal?: T) {
    this.default = defaultVal ?? typeDefault;
  }

  /**
   * Copies the value of `src` into `dest` and returns `dest`
   *
   * **Note**: copy allow to copy primitive property types
   * (number, string, boolean), as well as custom types. For more
   * information about custom types, please look at [[ArrayProperty]] and
   * [[CopyableProperty]]
   *
   * @param dest The destination reference
   * @param src The source reference
   * @return The destination reference
   */
  public copy(dest: T, src: T): T {
    return src;
  }

  /**
   * Copies the default value of this property into `dest`
   *
   * @param dest The destination reference
   * @return The destination reference
   */
  public copyDefault(dest: T): T {
    return this.copy(dest, this.default);
  }

  /**
   * Returns a clone of the default value saved in this property
   *
   * @return A cloned default value
   */
  public cloneDefault(): T {
    return this.default;
  }
}

/**
 * Array property
 *
 * @class property
 */
export class ArrayProperty<T> extends Property<T[]> {
  public constructor(opts?: T[]) {
    super([], opts);
  }

  /** @inheritdoc */
  public copy(dst: T[], src: T[]): T[] {
    dst.length = 0;
    dst.push(...src);
    return dst;
  }

  /** @inheritdoc */
  public cloneDefault(): T[] {
    return this.copyDefault([]);
  }
}

/**
 * Copyable property.
 *
 * Copyable types are object implementing the following methods:
 *
 * ```js
 * class MyObject {
 *
 *   copy(source) {
 *     // Copy data from source into `this`.
 *     return this;
 *   }
 *   clone() {
 *     return new (this.constructor)().copy(this);
 *   }
 * }
 * ```
 *
 * It's possible to use your own copyable types as component properties using
 * this class
 *
 * @class property
 */
export class CopyableProperty<T extends CopyClonableType> extends Property<T> {
  public constructor(options: CopyClonableOptions<T>) {
    super(new options.type(), options.default);
    // @todo: check that type is really copy/clonable in dev mode.
  }

  /** @inheritdoc */
  public copy(dst: T, src: T): T {
    return dst.copy(src);
  }

  /** @inheritdoc */
  public copyDefault(dest: T): T {
    return dest.copy(this.default);
  }

  /** @inheritdoc */
  public cloneDefault(): T {
    return this.default.clone();
  }
}

/**
 * Creates a new property of type reference.
 *
 * **Note**: this function is simply a shortcut for:
 * ```js
 * new new Property(null, ...);
 * ```
 *
 * ## Examples
 *
 * ```js
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   myRef: RefProp(null)
 * };
 * ```
 *
 * ### Decorator
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   ref(null)
 *   myRef!: any | null;
 * }
 * ```
 * @return A new [[Property]]
 */
export function RefProp<T>(defaultVal?: Nullable<T>) {
  return new Property(null, defaultVal);
}

/**
 * Creates a new property of type boolean.
 *
 * **Note**: this function is simply a shortcut for:
 * ```js
 * new new Property(false, ...);
 * ```
 *
 * ## Examples
 *
 * ```js
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   myBoolean: BooleanProp(true)
 * };
 * ```
 *
 * ### Decorator
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   boolean(true)
 *   myBoolean!: boolean;
 * }
 * ```
 * @return A new [[Property]]
 */
export function BooleanProp(defaultVal?: boolean) {
  return new Property(false, defaultVal);
}

/**
 * Creates a new property of type number.
 *
 * **Note**: this function is simply a shortcut for:
 * ```js
 * new new Property(0, ...);
 * ```
 *
 * ## Examples
 *
 * ```js
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   myNumber: NumberProp(100)
 * };
 * ```
 *
 * ### Decorator
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   number(100)
 *   myNumber!: number;
 * }
 * ```
 * @return A new [[Property]]
 */
export function NumberProp(defaultVal?: number) {
  return new Property(0, defaultVal);
}

/**
 * Creates a new property of type string.
 *
 * **Note**: this function is simply a shortcut for:
 * ```js
 * new new Property('', ...);
 * ```
 *
 * ## Examples
 *
 * ```js
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   myString: StringProp('Hello World!')
 * };
 * ```
 *
 * ### Decorator
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   string('Hello World!')
 *   myString!: string;
 * }
 * ```
 * @return A new [[Property]]
 */
export function StringProp(defaultVal?: string) {
  return new Property('', defaultVal);
}

/**
 * Creates a new property of type [[ArrayProperty]].
 *
 * **Note**: this function is simply a shortcut for:
 * ```js
 * new ArrayProperty();
 * ```
 *
 * ## Examples
 *
 * ```js
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   myArray: ArrayProp([ 0, 1, 2, 3 ])
 * };
 * ```
 *
 * ### Decorator
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   array([ 0, 1, 2, 3 ])
 *   myArray!: number[];
 * }
 * ```
 * @return A new [[ArrayProperty]]
 */
export function ArrayProp<T>(defaultVal?: T[]) {
  return new ArrayProperty(defaultVal);
}

/**
 * Creates a new property of type [[CopyableProperty]].
 *
 * **Note**: this function is simply a shortcut for:
 * ```js
 * new CopyableProperty(...);
 * ```
 *
 * ## Examples
 *
 * ```js
 * class Vector2() {
 *   constructor(x, y) {
 *     this.x = x;
 *     this.y = y;
 *   }
 *   copy(source) {
 *     this.x = source.x;
 *     this.y = source.y;
 *     return this;
 *   }
 *   clone(): Vector2 {
 *     return new (this.constructor)().copy(this);
 *   }
 * }
 *
 * class MyComponent extends ComponentData {}
 * MyComponent.Properties = {
 *   myCopyable: CopyableProp({ type: Vector2, default: new Vector2(0, 0) })
 * };
 * ```
 *
 * ### Decorator
 *
 * ```ts
 * class MyComponent extends ComponentData {
 *   copyable({ type: Vector2, default: new Vector2(0, 0) })
 *   myCopyable!: Vector2;
 * }
 * ```
 * @return A new [[CopyableProperty]]
 */
export function CopyableProp<T extends CopyClonableType>(
  opts: CopyClonableOptions<T>
) {
  return new CopyableProperty(opts);
}

export interface PropertyOptions<T> {
  default?: T;
}

export interface CopyClonableOptions<T> {
  type: Constructor<T>;
  default?: T;
}

export interface CopyClonableType {
  copy(source: this): this;
  clone(): this;
}
