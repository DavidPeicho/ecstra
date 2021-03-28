import { Nullable } from '../types';

export class Observer<T = void> {
  public id: Nullable<string> = null;
  public autoRemove = false;
  public callback: ObserverCallback<T> = () => {
    /** Empty. */
  };

  public constructor(cb?: ObserverCallback<T>) {
    if (cb) {
      this.callback = cb;
    }
  }
}

export class Observable<T = void> {
  /** @hidden */
  private _observers: Observer<T>[] = [];

  public observe(observer: Observer<T>): this {
    this._observers.push(observer);
    return this;
  }

  public unobserve(observer: Observer<T>): this {
    const index = this._observers.indexOf(observer);
    if (index >= 0) {
      this._observers.splice(index, 1);
    }
    return this;
  }

  public unobserveFn(cb: ObserverCallback<T>): this {
    const observers = this._observers;
    for (let i = 0; i < observers.length; ++i) {
      if (observers[i].callback === cb) {
        observers.splice(i, 1);
        return this;
      }
    }
    return this;
  }

  public unobserveId(id: string): this {
    const observers = this._observers;
    for (let i = observers.length - 1; i >= 0; --i) {
      if (observers[i].id === id) {
        observers.splice(i, 1);
      }
    }
    return this;
  }

  public notify(data: T): void {
    const observers = this._observers;
    for (const o of observers) {
      o.callback(data);
    }
  }

  public get count(): number {
    return this._observers.length;
  }
}

type ObserverCallback<T> = (data: T) => void;
