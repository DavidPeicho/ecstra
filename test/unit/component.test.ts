import test from 'ava';

import { ComponentData } from '../../src/component.js';
import { boolean } from '../../src/decorators.js';
import { ArrayProp, BooleanProp } from '../../src/property.js';
import { World } from '../../src/world.js';

test('Component > ComponentData > Properties created', (t) => {
  const world = new World();
  let entity = world.create();

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
  t.true(comp.myBoolean !== undefined);
  t.true(comp.myArray !== undefined);

  // Same test, but with decorators instead of manual properties.

  class TestComponentDecorator extends ComponentData {
    @boolean()
    myBoolean!: boolean;
  }

  entity = world.create();
  entity.addComponent(TestComponentDecorator);
  const compDecorator = entity.read(TestComponentDecorator)!;
  t.true(compDecorator.myBoolean !== undefined);
});
