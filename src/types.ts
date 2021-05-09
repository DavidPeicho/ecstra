import { Component, ComponentData, Properties } from './component';
import { Entity } from './entity';
import { ObjectPool } from './pool/pool';
import { Property } from './property';
import { StaticQueries, System } from './system';
import { SystemGroup } from './system-group';
import { World } from './world';

/** Describes a type T that can be null */
export type Nullable<T> = T | null;
/** Describes a type T that can be undefined */
export type Option<T> = T | undefined;

export type ComponentOf<P> = P extends ObjectPool<infer C> ? C : never;
/** Inner Entity type derived from a World type */
export type EntityOf<W> = W extends World<infer E> ? E : never;
/** Inner list of propereties type derived from a Component type */
export type PropertiesOf<C extends Component> = Partial<
  Omit<C, keyof Component>
>;

export type Constructor<T> = new (...args: any[]) => T;

export type EntityClass<T extends Entity> = new (name?: string) => T;

/** Class type for a SystemGroup derived type */
export type SystemGroupClass<T extends SystemGroup = SystemGroup> =
  Constructor<T> & {
    readonly Mame?: string;
  };

/** Class type for a System derived type */
export type SystemClass<T extends System = System> = (new (
  group: SystemGroup,
  opts: any
) => T) & {
  Name?: string;
  Queries?: StaticQueries;
  Group?: Constructor<SystemGroup>;
  UpdateAfter?: SystemClass[];
  UpdateBefore?: SystemClass[];
};

/** Class type for a Component derived type */
export type ComponentClass<T extends Component = Component> = Constructor<T> & {
  Name?: string;
};

/** Class type for a ComponentData derived type */
export type DataComponentClass<T extends ComponentData = ComponentData> =
  Constructor<T> & {
    Name?: string;
    Properties?: Properties;
    readonly _MergedProoperties: Properties;
  };

/** Class type for a Property derived type */
export type PropertyClass<T extends Property<any> = Property<any>> =
  Constructor<T>;
