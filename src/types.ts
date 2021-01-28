import { GenericComponent } from './component';
import { StaticQueries, System } from './system/system';
import { SystemGroup } from './system/system-group';

export type Constructor<T> = new (...args: unknown[]) => T;

export type SystemGroupClass<T extends SystemGroup> = Constructor<T> & {
  readonly name?: string;
};
export type SystemClass<T extends System = System> = Constructor<T> & {
  readonly queries?: StaticQueries;
  readonly group?: Constructor<SystemGroup>;
  readonly updateAfter?: SystemClass[];
  readonly updateBefore?: SystemClass[];
};
export type ComponentClass<
  T extends GenericComponent = GenericComponent
> = Constructor<T> & {
  Identifier: number;
  Name: Nullable<string>;
};

export type Nullable<T> = T | null;
export type Option<T> = T | undefined;
