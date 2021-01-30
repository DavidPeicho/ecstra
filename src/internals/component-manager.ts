import { ComponentClass } from '../types';

export class ComponentManager {
  public readonly maxComponentTypeCount: number;

  private readonly _useManualPooling: boolean;
  private _lastIdentifier: number;
  private _classToIdentifier: Map<ComponentClass, number>;

  public constructor(options: ComponentManagerOptions) {
    const { maxComponentType, useManualPooling } = options;
    this.maxComponentTypeCount = maxComponentType;
    this._useManualPooling = useManualPooling;
    this._lastIdentifier = 0;
    this._classToIdentifier = new Map();
  }

  public getIdentifier(Class: ComponentClass): number {
    return this._classToIdentifier.get(Class)!;
  }

  public registerComponent(Class: ComponentClass): number {
    if (!this._classToIdentifier.has(Class)) {
      if (this._lastIdentifier >= this.maxComponentTypeCount) {
        throw new Error('reached maximum number of components registered.');
      }
      const identifier = this._lastIdentifier++;
      this._classToIdentifier.set(Class, identifier);
    }
    return this._classToIdentifier.get(Class)!;
  }
}

export type ComponentManagerOptions = {
  maxComponentType: number;
  useManualPooling: boolean;
};
