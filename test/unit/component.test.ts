import test from 'ava';

import { ComponentData } from '../../src/component.js';
import { boolean, number, string, array, ref } from '../../src/decorators.js';
import { ArrayProp, BooleanProp } from '../../src/property.js';
import { World } from '../../src/world.js';
import { FooComponent } from './utils.js';

test('Component > ComponentData > Properties created', (t) => {
  const world = new World();
  let entity = world.create();

  class TestComponent extends ComponentData {
    static Properties = {
      myBoolean: BooleanProp(),
      myArray: ArrayProp()
    };
    myBoolean!: boolean;
    myArray!: any[];
  }

  entity.add(TestComponent);
  const comp = entity.read(TestComponent)!;
  t.true(comp.myBoolean !== undefined);
  t.true(comp.myArray !== undefined);

  // Same test, but with decorators instead of manual properties.

  class TestComponentDecorator extends ComponentData {
    @boolean()
    myBoolean!: boolean;
  }

  entity = world.create();
  entity.add(TestComponentDecorator);
  const compDecorator = entity.read(TestComponentDecorator)!;
  console.log(compDecorator);
  t.true(compDecorator.myBoolean !== undefined);
});

test('Component > ComponentData > copy', (t) => {
  const world = new World();
  const entity = world.create();

  entity.add(FooComponent);
  const component = entity.read(FooComponent)!;
  t.true(component.isFoo);
  t.is(component.count, 1);
  t.is(component.dummy, 'dummy');

  component.copy({
    isFoo: false,
    count: 100
  });
  t.is(component.isFoo, false);
  t.is(component.count, 100);

  const source = new FooComponent();
  source.count = -1;
  source.dummy = 'notdummy';
  component.copy(source);
  t.is(component.count, -1);
  t.is(component.dummy, 'notdummy');
});

test('Component > ComponentData > Decorators', (t) => {
  const obj = { foo: 'foo', bar: 'bar' };

  // Test component with default value set in class.

  class TestComponentDecorator extends ComponentData {
    @boolean(true)
    myBoolean!: boolean;
    @number(100)
    myNumber!: number;
    @string('hello')
    myString!: string;
    @array(['defaultStr1', 'defaultStr2'])
    myArray!: string[];
    @ref(obj)
    myRef!: { foo: string; bar: string } | null;
  }

  const component = new TestComponentDecorator();
  t.is(component.myBoolean, true);
  t.is(component.myNumber, 100);
  t.is(component.myString, 'hello');
  t.deepEqual(component.myArray, ['defaultStr1', 'defaultStr2']);
  t.is(component.myRef, obj);

  component.myNumber = Number.POSITIVE_INFINITY;
  component.init({});
  t.is(component.myNumber, 100);
});
