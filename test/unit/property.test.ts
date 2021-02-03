import test from 'ava';

import {
  ArrayProp,
  BooleanProp,
  CopyableProp,
  CopyClonableType,
  NumberProp,
  RefProp,
  StringProp
} from '../../src/property.js';

test('Property > primitives', (t) => {
  t.is(NumberProp().default, 0);
  t.is(NumberProp(1).default, 1);

  t.false(BooleanProp().default);
  t.true(BooleanProp(true).default);

  t.is(StringProp().default, '');
  t.is(StringProp('Hello World!').default, 'Hello World!');

  const o = {};
  t.is(RefProp().default, null);
  t.is(RefProp(o).default, o);
  t.not(RefProp(o).copy(o, {}), o);
});

test('Property > array', (t) => {
  t.deepEqual(ArrayProp().default, []);
  t.deepEqual(ArrayProp(['hello', 'world']).default, ['hello', 'world']);

  const p = ArrayProp(['hello', 'world']);
  t.deepEqual(p.default, p.cloneDefault());
  t.deepEqual(p.default, p.copy(p.default, []));
  t.not(p.default, p.cloneDefault()); // Reference shouldn't be identical.
});

test('Property > copyable', (t) => {
  class Copyable implements CopyClonableType {
    a: number;
    b: number;
    constructor(a?: number, b?: number) {
      this.a = a ?? 0;
      this.b = b ?? 0;
    }
    copy(source: Copyable): this {
      this.a = source.a;
      this.b = source.b;
      return this;
    }
    clone(): this {
      return new Copyable().copy(this) as this;
    }
  }
  const prop = CopyableProp({ type: Copyable, default: new Copyable(1, 2) });
  t.is(prop.default.a, 1);
  t.is(prop.default.b, 2);
  const cp = prop.copy(new Copyable(), prop.default);
  t.is(cp.a, 1);
  t.is(cp.b, 2);
});
