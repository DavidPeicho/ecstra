import { ComponentData } from './component.js';
import { BooleanProp, Property } from './property.js';
import { DataComponentClass, PropertyClass } from './types.js';

function setupProperty<T extends Property<any>>(Class: PropertyClass<T>, opts?: any) {
  return function(target: ComponentData, key: string) {
    const constructor = target.constructor as DataComponentClass;
    if (!constructor.Properties) {
      constructor.Properties = {};
    }
    constructor.Properties[key] = new Class(opts);
  }
}

export function property<T>(options: PropertyClass | PropertyDecoratorOptions<T>) {
  return function(target: ComponentData, key: string) {
    const constructor = target.constructor as DataComponentClass;
    if (!constructor.Properties) {
      constructor.Properties = {};
    }
    if (typeof options === 'function') {
      constructor.Properties[key] = new (options as PropertyClass)();
    } else {
      const Class = options.type;
      constructor.Properties[key] = new Class(options);
    }
  }
}

export function boolean(defaultValue?: boolean) {
  return setupProperty(BooleanProp, defaultValue);
}

export interface PropertyDecoratorOptions<T> {
  type: PropertyClass;
  default?: T;
}
