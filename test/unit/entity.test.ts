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
  t.is(entity['_archetype'], world['_components']['_emptyArchetype']);

  t.true(entity.isEmpty);
  t.deepEqual(entity.componentClasses, []);

  entity.add(FooComponent);
  t.false(entity.isEmpty);
  t.true(entity.has(FooComponent));
  t.deepEqual(entity.componentClasses, [FooComponent]);
  t.true(entity.read(FooComponent)!.constructor === FooComponent);

  entity.add(BarComponent);
  t.true(entity.has(BarComponent));
  t.deepEqual(entity.componentClasses, [FooComponent, BarComponent]);
  t.true(entity.read(BarComponent)!.constructor === BarComponent);
});

test('Entity - remove component', (t) => {
  const world = new World();
  const entity = world.create();
  t.true(entity.isEmpty);
  t.deepEqual(entity.componentClasses, []);

  entity.add(FooComponent);
  t.false(entity.isEmpty);

  entity.remove(FooComponent);
  t.true(entity.isEmpty);
  t.false(entity.has(FooComponent));

  entity.add(BarComponent).add(FooComponent);
  t.true(entity.has(FooComponent));
  t.true(entity.has(BarComponent));

  entity.remove(BarComponent);
  t.true(entity.has(FooComponent));
  t.false(entity.has(BarComponent));
});

test('Entity - destroy', (t) => {
  const world = new World();
  const entity = world.create('a').add(FooComponent).add(BarComponent);
  world.create('b').add(FooComponent);
  world.create('b').add(BarComponent);

  // Assumes entity are destroyed synchronously
  const archetypeId = entity.archetype!.hash;
  entity.destroy();
  t.is(entity.archetype, null);
  t.false(world['_components'].archetypes.has(archetypeId));
});
