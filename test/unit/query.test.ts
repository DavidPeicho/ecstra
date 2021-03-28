import test from 'ava';
import { TagComponent } from '../../src/component.js';
import { Archetype } from '../../src/internals/archetype.js';
import { Not, Query } from '../../src/query.js';
import { System, SystemOptions } from '../../src/system.js';
import { SystemGroup } from '../../src/system-group';
import { World } from '../../src/world.js';
import {
  BarComponent,
  FooBarSystem,
  FooComponent,
  spy,
  SpyFunction
} from './utils.js';
import { Entity } from '../../src/entity.js';

test('Query > archetype match', (t) => {
  class MyTagComponent extends TagComponent {}
  const query = new Query('', [FooComponent, BarComponent]);
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
  const query = new Query('', [
    FooComponent,
    BarComponent,
    Not(MyTagComponent)
  ]);
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
    public static Queries = {
      foobar: [FooComponent, BarComponent],
      all: [FooComponent, BarComponent, MyTagComponent]
    };
    execute() {
      /** Empty. */
    }
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
    public static Queries = {
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
    public static Queries = {
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

test('Query Manager > added entity triggers query callback', (t) => {
  class MySystem extends System {
    public static Queries = {
      foobar: [FooComponent]
    };
    constructor(group: SystemGroup, options: Partial<SystemOptions>) {
      super(group, options);
      this.queries.foobar.onEntityAdded = spy();
    }
    execute() {
      /** Empty. */
    }
  }

  const world = new World().register(MySystem, {});
  const system = world.system(MySystem) as MySystem;

  const added = system['queries'].foobar.onEntityAdded as SpyFunction;
  t.false(added.called);
  world.create().add(FooComponent);
  t.true(added.called);
  t.is(added.calls.length, 1);

  const entityA = world.create();

  t.is(added.calls.length, 1);
  entityA.add(FooComponent);
  t.is(added.calls.length, 2);
});

test('Query Manager > removed entity triggers query callback', (t) => {
  class MySystem extends System {
    public static Queries = {
      foobar: [FooComponent]
    };
    constructor(group: SystemGroup, options: Partial<SystemOptions>) {
      super(group, options);
      this.queries.foobar.onEntityRemoved = spy();
    }
    execute() {
      /** Empty. */
    }
  }

  const world = new World().register(MySystem, {});
  const system = world.system(MySystem) as MySystem;

  const removed = system['queries'].foobar.onEntityRemoved as SpyFunction;
  t.false(removed.called);
  const entityA = world.create().add(FooComponent);
  t.is(removed.calls.length, 0);

  entityA.remove(FooComponent);
  t.is(removed.calls.length, 1);
  entityA.add(FooComponent).destroy();
  t.is(removed.calls.length, 2);
});

test('Query Manager > entity move to new archetype triggers query callback', (t) => {
  class MySystem extends System {
    public static Queries = {
      foo: [FooComponent],
      foobar: [FooComponent, BarComponent]
    };
    constructor(group: SystemGroup, options: Partial<SystemOptions>) {
      super(group, options);
      this.queries.foo.onEntityAdded = spy();
      this.queries.foo.onEntityRemoved = spy();
      this.queries.foobar.onEntityAdded = spy();
      this.queries.foobar.onEntityRemoved = spy();
    }
    execute() {
      /** Empty. */
    }
  }

  const world = new World().register(MySystem, {});
  const system = world.system(MySystem) as MySystem;

  t.is((system.queries.foo.onEntityAdded as SpyFunction).calls.length, 0);
  t.is((system.queries.foo.onEntityRemoved as SpyFunction).calls.length, 0);
  t.is((system.queries.foobar.onEntityAdded as SpyFunction).calls.length, 0);
  t.is((system.queries.foobar.onEntityRemoved as SpyFunction).calls.length, 0);

  const entity = world.create().add(FooComponent);
  t.is((system.queries.foo.onEntityAdded as SpyFunction).calls.length, 1);
  entity.add(BarComponent);
  t.is((system.queries.foo.onEntityRemoved as SpyFunction).calls.length, 1);
  t.is((system.queries.foobar.onEntityAdded as SpyFunction).calls.length, 1);
});

test('Query Manager > clear archetype observers when query is deleted', (t) => {
  class MySystem extends System {
    public static Queries = {
      foo: [FooComponent]
    };
    constructor(group: SystemGroup, options: Partial<SystemOptions>) {
      super(group, options);
    }
    execute() {
      /** Empty. */
    }
  }

  const world = new World().register(MySystem, {});
  const entity = world.create().add(FooComponent);
  const archetype = entity.archetype as Archetype<Entity>;

  t.is(archetype.onEntityAdded.count, 1);
  t.is(archetype.onEntityRemoved.count, 1);
  entity.remove(FooComponent);
  t.is(archetype.onEntityAdded.count, 0);
  t.is(archetype.onEntityRemoved.count, 0);
});
