import { GenericComponent } from "./component";
import { StaticQueries, System } from './system/system';
import { SystemGroup } from "./system/system-group";

export type Constructor<T> = new (...args: unknown[]) => T;

export type SystemClass<T extends System = System> = Constructor<T> & {
  readonly queries?: StaticQueries;
  readonly group?: Constructor<SystemGroup>;
};
export type ComponentClass<T extends GenericComponent = GenericComponent> =
  Constructor<T> & {
    Identifier: number;
    Name: Nullable<string>;
  };

export type Nullable<T> = T | null;
export type Option<T> = T | undefined;
