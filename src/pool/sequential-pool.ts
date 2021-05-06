import { Constructor } from '../types';
import { DefaultPoolOptions } from './pool';

export class SequentialPool<T> {
  protected readonly _class;
  protected readonly _list: T[];
  protected readonly _growPercentage: number;
  protected _freeSlot: number;

  public constructor(
    Class: Constructor<T>,
    options: Partial<DefaultPoolOptions<T>> = {}
  ) {
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
    return val;
  }

  public release(): void {
    this._freeSlot = 0;
  }

  public execute(cb: (value: T) => void): void {
    const list = this._list;
    for (let i = 0; i < this._freeSlot; ++i) {
      cb(list[i]);
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

  public get allocatedSize(): number {
    return this._list.length;
  }

  public get used(): number {
    return this._freeSlot;
  }
}
