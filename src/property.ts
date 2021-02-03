import { Constructor, Nullable } from './types';

export class Property<T> {
  public default: T;

  private readonly _hasUserDefault: boolean;

  public constructor(typeDefault: T, defaultVal?: T) {
    this.default = defaultVal ?? typeDefault;
    this._hasUserDefault = this.default === defaultVal;
  }

  public copy(_: T, src: T): T {
    return src;
  }

  public copyDefault(dest: T): T {
    return this.copy(dest, this.default);
  }

  public cloneDefault(): T {
    return this.default;
  }

  public get hasUserDefault() {
    return this._hasUserDefault;
  }
}

export class ArrayProperty<T> extends Property<T[]> {
  public constructor(opts?: T[]) {
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

export class CopyableProperty<T extends CopyClonableType> extends Property<T> {
  public constructor(options: CopyClonableOptions<T>) {
    super(new options.type(), options.default);
    // @todo: check that type is really copy/clonable in dev mode.
  }

  public copy(dst: T, src: T): T {
    return dst.copy(src);
  }

  public copyDefault(dest: T): T {
    return dest.copy(this.default);
  }

  public cloneDefault(): T {
    return this.default.clone();
  }
}

export function RefProp<T>(defaultVal?: Nullable<T>) {
  return new Property(null, defaultVal);
}

export function BooleanProp(defaultVal?: boolean) {
  return new Property(false, defaultVal);
}

export function NumberProp(defaultVal?: number) {
  return new Property(0, defaultVal);
}

export function StringProp(defaultVal?: string) {
  return new Property('', defaultVal);
}

export function ArrayProp<T>(defaultVal?: T[]) {
  return new ArrayProperty(defaultVal);
}

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
