import test from 'ava';
import { TagComponent } from '../../src/component.js';
import { Archetype } from '../../src/internals/archetype.js';
import { Not, Query } from '../../src/query.js';
import { System } from '../../src/system.js';
import { World } from '../../src/world.js';
import { BarComponent, FooBarSystem, FooComponent } from './utils.js';

test('Query > archetype match', (t) => {
  class MyTagComponent extends TagComponent {}
  const query = new Query([FooComponent, BarComponent]);
  t.true(query.matches(new Archetype([BarComponent, FooComponent], '')));
  t.true(
    query.matches(
      new Archetype([BarComponent, FooComponent, MyTagComponent], '')
    )
  );
  t.false(query.matches(new Archetype([FooComponent], '')));
  t.false(query.matches(new Archetype([BarComponent], '')));
});

test('Query > archetype match (not) operator', (t) => {
  class MyTagComponent extends TagComponent {}
  const query = new Query([FooComponent, BarComponent, Not(MyTagComponent)]);
  t.true(query.matches(new Archetype([BarComponent, FooComponent], '')));
  t.false(
    query.matches(
      new Archetype([BarComponent, FooComponent, MyTagComponent], '')
    )
  );
});

test('Query Manager > intersection', (t) => {
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

  t.true(system['queries'].foobar.hasEntity(entityA));
  t.true(system['queries'].foobar.hasEntity(entityB));
  t.false(system['queries'].foobar.hasEntity(entityC));

  t.true(system['queries'].all.hasEntity(entityB));
  t.false(system['queries'].all.hasEntity(entityA));
  t.false(system['queries'].all.hasEntity(entityC));
});

test('Query Manager > register system when archetypes already exist', (t) => {
  class MySystem extends System {
    public static queries = {
      q: [FooComponent]
    };
    execute() {}
  }

  const world = new World();
  const entity = world
    .create('foobar_entity')
    .add(FooComponent)
    .add(BarComponent);

  // Assumes adding component is synchronous.
  world.register(MySystem, {});
  const system = world.system(MySystem)!;
  t.true(system['queries'].q.hasEntity(entity));
});

test('Query Manager > `not` selector', (t) => {
  class MySystem extends System {
    public static queries = {
      foobar: [FooComponent, Not(BarComponent)]
    };
    execute() {}
  }

  const world = new World().register(MySystem, {});
  const system = world.system(MySystem)!;

  const entityA = world.create('foobar_entity').add(FooComponent);
  const entityB = world
    .create('foobartag_entity')
    .add(FooComponent)
    .add(BarComponent);

  // Assumes adding component is synchronous.
  t.true(system['queries'].foobar.hasEntity(entityA));
  t.false(system['queries'].foobar.hasEntity(entityB));
});

test('Query Manager > component added / removed', (t) => {
  const world = new World().register(FooBarSystem, {});
  const system = world.system(FooBarSystem)!;
  const entity = world.create().add(FooComponent);
  // Assumes adding component is synchronous.
  t.false(system['queries'].foobar.hasEntity(entity));
  entity.add(BarComponent);
  t.true(system['queries'].foobar.hasEntity(entity));
  entity.remove(FooComponent);
  // Assumes removing component is synchronous.
  t.false(system['queries'].foobar.hasEntity(entity));
});

test('Query Manager > entity destroyed', (t) => {
  const world = new World().register(FooBarSystem, {});
  const system = world.system(FooBarSystem)!;
  const entity = world.create().add(FooComponent).add(BarComponent);
  // Assumes adding component is synchronous.
  t.true(system['queries'].foobar.hasEntity(entity));
  entity.destroy();
  // Assumes destroying entity is synchronous.
  t.false(system['queries'].foobar.hasEntity(entity));
});
