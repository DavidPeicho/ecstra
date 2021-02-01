import { Constructor, Nullable } from './types';

export class Property<T> {
  public static Name = 'BaseProperty';

  protected _default: T;

  public constructor(options: PropertyOptions<T>) {
    this._default = options.default ?? options.typeDefault;
  }

  public copy(_: T, src: T): T {
    return src;
  }

  public copyDefault(dest: T): T {
    return this.copy(dest, this._default);
  }

  public cloneDefault(): T {
    return this._default;
  }
}

export class RefProp<T> extends Property<Nullable<T>> {
  public constructor() {
    super({ typeDefault: null });
  }
}

export class BooleanProp extends Property<boolean> {
  public constructor(defaultValue?: boolean) {
    super({ typeDefault: false, default: defaultValue });
  }
}

export class NumberProp extends Property<number> {
  public constructor() {
    super({ typeDefault: 0 });
  }
}

export class StringProp extends Property<string> {
  public constructor() {
    super({ typeDefault: '' });
  }
}

export class ArrayProp<T> extends Property<T[]> {
  public constructor(defaultValue?: T) {
    super({ typeDefault: [] });
  }

  public copy(dst: T[], src: T[]): T[] {
    dst.length = 0;
    dst.push(...src);
    return dst;
  }

  public cloneDefault(): T[] {
    return this.copyDefault([]);
  }
}

export class CopyProp<T extends CopyClonableType> extends Property<T> {
  public static Name = 'CopyClonable';

  public constructor(options: CopyClonableOptions<T>) {
    super({ typeDefault: new options.type(), default: options.default });
    // @todo: check that type is really copy/clonable in dev mode.
  }

  public copy(dst: T, src: T): T {
    return dst.copy(src);
  }

  public copyDefault(dest: T): T {
    return dest.copy(this._default);
  }

  public cloneDefault(): T {
    return this._default.clone();
  }
}

export interface PropertyOptions<T> {
  typeDefault: T;
  default?: T;
}

export interface CopyClonableOptions<T> {
  type: Constructor<T>;
  default?: T;
}

interface CopyClonableType {
  copy(source: this): this;
  clone(): this;
}
