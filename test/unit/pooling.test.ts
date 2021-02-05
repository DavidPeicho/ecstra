import test from 'ava';

import { Entity } from '../../src/entity.js';
import {  DefaultPool } from '../../src/pool.js';
import { World } from '../../src/world.js';
import { FooComponent } from './utils.js';

test('Pooling > grow on acquire', (t) => {
  const pool = new DefaultPool(Entity);
  t.is(pool.allocatedSize, 0);
  pool.acquire();
  t.true(pool.allocatedSize > 0);
});

test('Pooling > acquire re-use free slots', (t) => {
  const pool = new DefaultPool(Entity);
  t.is(pool.allocatedSize, 0);
  const value = pool.acquire();
  t.is(pool.used, 1);
  pool.release(value);
  t.is(pool.used, 0);
  t.is(value, pool.acquire());
});

test('Pooling > over-release does not bring the pool into UB', (t) => {
  const pool = new DefaultPool(Entity);
  const value = pool.acquire();
  for (let i = 0; i < 100; ++i) {
    pool.release(value);
  }
  t.is(pool.used, 0);
  t.is(value, pool.acquire());
  t.is(pool.used, 1);
});

test('Pooling > Component > add & release component', (t) => {
  const world = new World({
    useManualPooling: false
  });
  debugger;
  const entity = world.create();
  entity.add(FooComponent);
  const ref = entity.read(FooComponent);
  entity.remove(FooComponent);
  entity.add(FooComponent);

  const entityB = world.create();
  entityB.add(FooComponent);
  const entityC = world.create();
  entityC.add(FooComponent);

  entity.remove(FooComponent);
  entity.add(FooComponent);
  t.is(ref, entity.read(FooComponent));
});
