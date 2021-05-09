import test from 'ava';

import { CommandBuffer } from '../../src/command-buffer.js';
import { Entity } from '../../src/entity.js';
import { World } from '../../src/world.js';

import { FooComponent, makeProxy, Proxy } from './utils.js';

test.beforeEach((t) => {
  const world = new World();
  t.context = {
    world,
    entity: world.create()
  };
});

test('Command Buffer > remove entity', (t) => {
  const buffer = new CommandBuffer();
  const entity = (t.context as Context).entity;
  entity.destroy = makeProxy(entity.destroy.bind(entity));
  buffer.remove(entity);
  t.false((entity.destroy as Proxy<Entity>).called);
  buffer.playback();
  t.true((entity.destroy as Proxy<Entity>).called);
});

test('Command Buffer > add component to entity', (t) => {
  const buffer = new CommandBuffer();
  const entity = (t.context as Context).entity;
  entity.add = makeProxy(entity.add.bind(entity));
  buffer.addComponent(entity, FooComponent, { count: 10 });
  t.false((entity.add as Proxy<Entity>).called);
  buffer.playback();
  t.true((entity.add as Proxy<Entity>).called);
  t.true(entity.has(FooComponent));

  const foo = entity.read(FooComponent) as FooComponent;
  t.is(
    foo.count,
    10,
    'cmd buffer buffer playback must init component properly'
  );
});

test('Command Buffer > remove component from entity', (t) => {
  const buffer = new CommandBuffer();
  const entity = (t.context as Context).entity;
  entity.remove = makeProxy(entity.remove.bind(entity));
  entity.add(FooComponent);
  buffer.removeComponent(entity, FooComponent);

  t.false((entity.remove as Proxy<Entity>).called);
  buffer.playback();
  t.true((entity.remove as Proxy<Entity>).called);
  t.false(entity.has(FooComponent));
});

type Context = {
  world: World;
  entity: Entity;
};
