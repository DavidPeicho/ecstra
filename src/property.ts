import { Constructor, Nullable } from './types';

export class Property<T> {
  public static Name = 'BaseProperty';

  protected _default: T;

  public constructor(typeDefault: T, opts?: T | PropertyOptions<T>) {
    this._default = typeDefault;
    if (opts) {
      if ((typeDefault as Object).constructor === (opts as Object).constructor) {
        this._default = opts as T;
      } else {
        this._default = (opts as PropertyOptions<T>).default ?? typeDefault;
      }
    }
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
    super(null);
  }
}

export class BooleanProp extends Property<boolean> {
  public constructor(opts?: boolean | PropertyOptions<boolean>) {
    super(false, opts);
  }
}

export class NumberProp extends Property<number> {
  public constructor(opts?: number | PropertyOptions<number>) {
    super(0, opts);
  }
}

export class StringProp extends Property<string> {
  public constructor(opts?: string | PropertyOptions<string>) {
    super('', opts);
  }
}

export class ArrayProp<T> extends Property<T[]> {
  public constructor(opts?: T[] | PropertyOptions<T[]>) {
    super([], opts);
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
    super(new options.type(), options);
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
