import test from 'ava';

import { ComponentData } from '../../src/component.js';
import { ArrayProp, BooleanProp } from '../../src/property.js';

import { World } from '../../src/world.js';

test('Component > ComponentData > Properties created', (t) => {
  const world = new World();
  const entity = world.create();

  class TestComponent extends ComponentData {
    static Properties = {
      myBoolean: new BooleanProp(),
      myArray: new ArrayProp()
    };
    myBoolean!: boolean;
    myArray!: any[];
  }

  entity.addComponent(TestComponent);
  const comp = entity.read(TestComponent)!;
  t.true(!!comp.myBoolean);
  t.true(!!comp.myArray);
});
