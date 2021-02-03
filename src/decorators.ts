import { ComponentData } from './component.js';
import {
  ArrayProp,
  BooleanProp,
  CopyableProp,
  CopyClonableOptions,
  CopyClonableType,
  NumberProp,
  Property,
  RefProp,
  StringProp
} from './property.js';
import { DataComponentClass, Nullable, PropertyClass } from './types.js';

function setupProperty(property: Property<unknown>) {
  return function (target: ComponentData, key: string) {
    const constructor = target.constructor as DataComponentClass;
    if (!constructor.Properties) {
      constructor.Properties = {};
    }
    const curr = constructor.Properties[key];
    if (!property.hasUserDefault && curr === undefined) {
      // No default value provided in the decorator, take the value
      // directly setup in the object.
      property.default = curr;
    }
    constructor.Properties[key] = property;
  };
}

export function property<T>(
  options: PropertyClass | PropertyDecoratorOptions<T>
) {
  return function (_: ComponentData, key: string) {
    if (typeof options === 'function') {
      setupProperty(new (options as PropertyClass)());
    } else {
      const Class = options.type;
      setupProperty(new Class(options));
    }
  };
}

export function boolean(defaultValue?: boolean) {
  return setupProperty(BooleanProp(defaultValue));
}

export function number(defaultValue?: number) {
  return setupProperty(NumberProp(defaultValue));
}

export function string(defaultValue?: string) {
  return setupProperty(StringProp(defaultValue));
}

export function array<T>(defaultValue?: T[]) {
  return setupProperty(ArrayProp(defaultValue));
}

export function ref<T>(defaultValue?: Nullable<T>) {
  return setupProperty(RefProp(defaultValue));
}

export function copyable<T extends CopyClonableType>(
  opts: CopyClonableOptions<T>
) {
  return setupProperty(CopyableProp(opts));
}

export interface PropertyDecoratorOptions<T> {
  type: PropertyClass;
  default?: T;
}
