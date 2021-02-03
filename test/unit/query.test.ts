import test from 'ava';
import { TagComponent } from '../../src/component.js';
import { System } from '../../src/system.js';
import { World } from '../../src/world.js';
import { BarComponent, FooComponent } from './utils.js';

test('Query > intersection', (t) => {
  class MyTagComponent extends TagComponent {}
  class MySystem extends System {
    public static queries = {
      foobar: [FooComponent, BarComponent],
      all: [FooComponent, BarComponent, MyTagComponent]
    };
    execute() {}
  }

  const world = new World().register(MySystem, {});
  const system = world.system(MySystem)!;

  debugger;
  const entityA = world
    .create('foobar_entity')
    .add(FooComponent)
    .add(BarComponent);
  const entityB = world
    .create('foobartag_entity')
    .add(FooComponent)
    .add(BarComponent)
    .add(MyTagComponent);
  const entityC = world.create('foo_entity').add(FooComponent);

  // Assumes adding component is synchronous.

  console.log(system['queries'].foobar.archetypes[0].entities);
  console.log(system['queries'].all.archetypes[0].entities);

  t.true(system['queries'].foobar.hasEntity(entityA));
  t.true(system['queries'].foobar.hasEntity(entityB));
  t.false(system['queries'].foobar.hasEntity(entityC));

  t.true(system['queries'].all.hasEntity(entityB));
  t.false(system['queries'].all.hasEntity(entityA));
  t.false(system['queries'].all.hasEntity(entityC));
});

test('Query > register system when archetypes already exist', (t) => {
  t.true(true);
});

test('Query > `not` selector', (t) => {
  t.true(true);
});

test('Query > component added', (t) => {
  t.true(true);
});

test('Query > component removed', (t) => {
  t.true(true);
});

test('Query > entity destroyed', (t) => {
  t.true(true);
});
