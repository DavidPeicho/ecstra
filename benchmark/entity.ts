import { Context, Benchmark } from './benchmark.js';

import { World } from '../src/world.js';

export default function(benchmark: Benchmark): void {
  benchmark
    .group('Entity')
    .add({
      name: 'create / destroy entities without pool',
      iterations: 5,
      setup: function(ctx: Context) {
        ctx.world = new World();
        ctx.entities = new Array(100000);
      },
      code: function(ctx: Context) {
        const len = ctx.entities.length;
        for (let i = 0; i < Math.floor(len / 3); ++i) {
          ctx.entities[i] = ctx.world.create();
        }
        for (let i = 0; i < Math.floor(len / 4); ++i) {
          ctx.entities[i].destroy();
          ctx.entities[i] = null;
        }
        for (let i = 0; i < len; ++i) {
          if (ctx.entities[i] !== null) {
            ctx.entities[i] = ctx.world.create();
          }
        }
      }
    })
    .add({
      name: 'create / destroy entities with pool',
      iterations: 5,
      setup: function(ctx: Context) {
        ctx.world = new World({
          useManualPooling: false
        });
        ctx.entities = new Array(100000);
      },
      code: function(ctx: Context) {
        const len = ctx.entities.length;
        for (let i = 0; i < Math.floor(len / 3); ++i) {
          ctx.entities[i] = ctx.world.create();
        }
        for (let i = 0; i < Math.floor(len / 4); ++i) {
          ctx.entities[i].destroy();
          ctx.entities[i] = null;
        }
        for (let i = 0; i < len; ++i) {
          if (ctx.entities[i] !== null) {
            ctx.entities[i] = ctx.world.create();
          }
        }
      }
    })
    .add({
      name: 'add component to entity',
      iterations: 5,
      setup: function(ctx: Context) {
        ctx.world = new World();
      },
      code: function(ctx: Context) {
      }
    });
}
