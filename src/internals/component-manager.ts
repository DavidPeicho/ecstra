import { ComponentClass } from '../types';

export class ComponentManager {
  public readonly maxComponentTypeCount: number;
  private _lastIdentifier: number;
  private _classToIdentifier: Map<ComponentClass, number>;

  public constructor(options: ComponentManagerOptions) {
    const { maxComponentType } = options;
    this.maxComponentTypeCount = maxComponentType;
    this._lastIdentifier = 0;
    this._classToIdentifier = new Map();
  }

  public getIdentifier(Class: ComponentClass): number {
    return this._classToIdentifier.get(Class)!;
  }

  public registerComponent(Class: ComponentClass): void {
    if (!this._classToIdentifier.has(Class)) {
      if (this._lastIdentifier >= this.maxComponentTypeCount) {
        throw new Error('reached maximum number of components registered.');
      }
      this._classToIdentifier.set(Class, this._lastIdentifier++);
    }
  }
}

export type ComponentManagerOptions = {
  maxComponentType: number;
};
