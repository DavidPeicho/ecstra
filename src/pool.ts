import { Constructor } from "./types";

export class Pool<T> {
  protected readonly _class;
  protected readonly _list: (T | null)[];
  protected readonly _growPercentage: number;
  protected _freeSlot: number;

  public constructor(Class: Constructor<T>, options: Partial<PoolOptions<T>> = {}) {
    this._class = Class;
    this._list = [];
    this._growPercentage = options.growthPercentage ?? 0.2;
    this._freeSlot = 0;
    if (options.initialCount) {
      this.expand(options.initialCount);
    }
  }

  public acquire(): T {
    if (this._freeSlot === this._list.length) {
      this.expand(Math.round(this._list.length * 0.2) + 1);
    }
    const val = this._list[this._freeSlot]!;
    this._list[this._freeSlot++] = null;
    return val;
  }

  public release(value: T): void {
    if (this._freeSlot === -1) {
      this._list[this._list.length] = value;
    } else {
      this._list[--this._freeSlot] = value;
    }
  }

  public expand(count: number): void {
    if (count <= 0) {
      return;
    }
    const Class = this._class;
    const start = this._list.length;
    const end = start + count;
    this._list.length = end;
    for (let i = start; i < end; ++i) {
      this._list[i] = new Class();
    }
  }

  public get used(): number {
    return this._freeSlot;
  }
}

interface PoolOptions<T> {
  initialCount: number;
  growthPercentage: number;
}
