import { ComponentData } from '../../src/component.js';
import { BooleanProp, NumberProp, StringProp } from '../../src/property.js';
import { System } from '../../src/system.js';

export class FooComponent extends ComponentData {
  public static Name = 'Foo';

  public static Properties = {
    isFoo: BooleanProp(true),
    count: NumberProp(1),
    dummy: StringProp('dummy')
  };

  public isFoo!: boolean;
  public count!: number;
  public dummy!: string;
}

export class BarComponent extends ComponentData {
  public static Name = 'Bar';

  public static Properties = {
    isBar: BooleanProp(true)
  };

  public isBar!: boolean;
}

export class FooBarSystem extends System {
  public static Queries = {
    foobar: [FooComponent, BarComponent]
  };
  execute(): void {
    /** Empty. */
  }
}

export function makeProxy<Ret>(fn: (...args: any[]) => Ret): Proxy<Ret> {
  function proxy(...args: unknown[]): Ret {
    proxy.calls.push(args);
    proxy.called = true;
    return fn(...args);
  }
  proxy.calls = [] as any[];
  proxy.called = false;
  return proxy as Proxy<Ret>;
}

export function spy(): SpyFunction {
  function proxy(...args: unknown[]) {
    proxy.calls.push(args);
    proxy.called = true;
  }
  proxy.calls = [] as unknown[];
  proxy.called = false;
  return proxy;
}

export interface SpyFunction {
  (): unknown;
  calls: unknown[];
  called: boolean;
}

export type Proxy<Return> = {
  (): Return;
  calls: unknown[];
  called: boolean;
};
