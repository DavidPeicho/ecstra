import { GenericComponent } from "./component";

export type Constructor<T> = new (...args: unknown[]) => T;

export type ComponentClass = Constructor<GenericComponent>;
