import { Component, ComponentData, Properties } from './component';
import { ObjectPool } from './pool';
import { Property } from './property';
import { StaticQueries, System } from './system';
import { SystemGroup } from './system-group';
import { World } from './world';

export type Nullable<T> = T | null;
export type Option<T> = T | undefined;

export type ComponentOf<P> = P extends ObjectPool<infer C> ? C : never;
export type EntityOf<W> = W extends World<infer E> ? E : never;
export type PropertiesOf<C extends Component> = Partial<
  Omit<C, keyof Component>
>;

export type Constructor<T> = new (...args: any[]) => T;

export type SystemGroupClass<T extends SystemGroup> = Constructor<T> & {
  readonly name?: string;
};
export type SystemClass<T extends System = System> = Constructor<T> & {
  readonly queries?: StaticQueries;
  readonly group?: Constructor<SystemGroup>;
  readonly updateAfter?: SystemClass[];
  readonly updateBefore?: SystemClass[];
};
export type ComponentClass<T extends Component = Component> = Constructor<T> & {
  Name?: string;
};
export type PropertyClass<
  T extends Property<any> = Property<any>
> = Constructor<T>;

export type DataComponentClass<
  T extends ComponentData = ComponentData
> = Constructor<T> & {
  Name?: string;
  Properties?: Properties;
};
