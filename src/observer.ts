export class Observer {
  /**
   * If `true`, the observable will remove this observer automatically
   * after a trigger
   */
  public notifyOnce: boolean;

  /**
   * Callback triggered by the observables its listening to
   */
  private _callback: ObserverCallback;

  /**
   * Creates a new instance of this class
   *
   * @param parameters - Parameters object, observer, or callback. For more information,
   *   take a look at the [[ObserverParameters]] interface
   */
  public constructor(parameters: ObserverParameters | ObserverCallback) {
    const { callback, notifyOnce = false } = createParameters(
      parameters,
      'callback'
    );
    this.notifyOnce = notifyOnce;
    this._callback = callback;
  }

  /** Callback triggered when notified */
  public get callback(): ObserverCallback {
    return this._callback;
  }

  /** `true` if the observer should get removed after a trigger */
  public get notifyOnce(): boolean {
    return this._notifyOnce;
  }
}

export class Observable {
  /**
   * List of observers listening on this observable
   *
   * @hidden
   * @internal
   */
  private _observers: Observer[];

  /** Creates a new instance of this class */
  public constructor() {
    super();
    this._observers = [];
  }

  /**
   * Copies the internal data of the source observable into this observable
   *
   * @param source - The source object to copy frome
   *
   * @return `this`, for chaining
   */
  public copy(source: Observable): this {
    this._observers = [...source._observers];
    return this;
  }

  /**
   * Clone this observable into a new instance. All observers are **shalow**
   * copied, i.e: only the references are copie
   *
   * @return The new observable
   */
  public clone(): Observable {
    return new Observable().copy(this);
  }

  /** @inheritdoc */
  public notify(...extraArgs: any[]): void {
    const observers = this._observers;
    for (let i = 0; i < observers.length; ++i) {
      const obs = observers[i];
      obs.callback(...extraArgs);
      if (obs.notifyOnce) {
        observers.splice(i, 1);
      }
    }
  }

  /** @inheritdoc */
  public observe(params: ObserveArgs): Observer {
    const index = this._findObserver(params);
    if (index !== -1) {
      return this._observers[index];
    }

    const observer = (params as Observer).isObserver
      ? (params as Observer)
      : new Observer(params);

    const priority =
      (isObject(params) ? (params as ObserverParameters).priority : null) ||
      Number.POSITIVE_INFINITY;

    // Inserts at index `priority`.
    this._observers.splice(priority, 0, observer);
    return observer;
  }

  /**
   * Makes the given argument stops observing this observable instance
   *
   * @param params - Callback, observer, or parameters object to remove
   *   from this observable list
   *
   * @return The instance of the observer removed, if found. `null` otherwise
   */
  public unobserve(params: ObserveArgs): Nullable<Observer> {
    return this._remove(this._findObserver(params));
  }

  /**
   * Updates the order of the observers, when notified
   *
   * @param params - Callback, observer, or parameters object to remove
   *   from this observable list
   * @param priority - Priority of the observer in the list
   */
  public updateOrder(params: ObserveArgs, priority: number): void {
    const index = this._findObserver(params);
    const observers = this._observers;
    if (index !== -1 && priority !== index) {
      const element = observers[index];
      observers.splice(index, 1);
      observers.splice(priority, 0, element);
    }
  }

  /**
   * Checks whether the given parameters matches an observers saved in
   * this observable
   *
   * @param params - Callback, observer, or parameters object to remove
   *   from this observable list
   * @return `true` if a corresponding observer is found, `false` otherwise
   */
  public hasObserver(params: ObserveArgs): boolean {
    return this._findObserver(params) !== -1;
  }

  /**
   * Removes all observers from this observable
   *
   * @return The list of removed observers
   */
  public clear(): Observer[] {
    const observers = this._observers;
    const copy = [...observers];
    observers.length = 0;
    return copy;
  }

  /**
   * @hidden
   * @internal
   */
  private _findObserver(params: ObserveArgs): number {
    if ((params as Observer).isObserver) {
      return this._observers.indexOf(params as Observer);
    }

    const callback = isObject(params as ObserverParameters)
      ? (params as ObserverParameters).callback
      : (params as ObserverCallback);

    const observers = this._observers;
    const nbObservers = observers.length;
    for (let i = 0; i < nbObservers; ++i) {
      const obs = observers[i];
      if (callback === obs.callback) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @hidden
   * @internal
   */
  private _remove(i: number): Nullable<Observer> {
    const observers = this._observers;
    if (i !== -1) {
      const obs = observers[i];
      observers.splice(i, 1);
      return obs;
    }
    return null;
  }
}
