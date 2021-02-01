import test from 'ava';

import { World } from '../../src/world.js';
import { BarComponent, FooComponent } from './utils.js';

test('Entity - create entity default', (t) => {
  const world = new World();

  const entity = world.create();
  t.is(entity.name, null);
  t.is(entity._components.size, 0);

  const entityB = world.create('coolentity');
  t.is(entityB.name, 'coolentity');
  t.is(entityB._components.size, 0);
});

test('Entity - add component', (t) => {
  const world = new World();
  const entity = world.create();
  t.is(entity['_archetype'], null);

  t.false(entity.hasAnyComponent);
  t.deepEqual(entity.componentClasses, []);

  entity.addComponent(FooComponent);
  t.true(entity.hasAnyComponent);
  t.true(entity.hasComponent(FooComponent));
  t.deepEqual(entity.componentClasses, [ FooComponent ]);
  t.true(entity.read(FooComponent)!.constructor === FooComponent);

  entity.addComponent(BarComponent);
  t.true(entity.hasComponent(BarComponent));
  t.deepEqual(entity.componentClasses, [ FooComponent, BarComponent ]);
  t.true(entity.read(BarComponent)!.constructor === BarComponent);
});

test('Entity - remove component', (t) => {
  const world = new World();
  const entity = world.create();
  t.false(entity.hasAnyComponent);
  t.deepEqual(entity.componentClasses, []);

  entity.addComponent(FooComponent);
  t.true(entity.hasAnyComponent);

  entity.removeComponent(FooComponent);
  t.false(entity.hasAnyComponent);
  t.false(entity.hasComponent(FooComponent));

  entity.addComponent(BarComponent).addComponent(FooComponent);
  t.true(entity.hasComponent(FooComponent));
  t.true(entity.hasComponent(BarComponent));

  entity.removeComponent(BarComponent);
  t.true(entity.hasComponent(FooComponent));
  t.false(entity.hasComponent(BarComponent));
});
