import { Context, Benchmark } from './benchmark.js';

import { boolean, number, array, string, ref } from '../src/decorators.js';
import { Entity } from '../src/entity.js';
import { ComponentData, TagComponent } from '../src/component.js';
import { World } from '../src/world.js';

class MyTagComponent extends TagComponent {}

class MyComponentData extends ComponentData {
  @boolean(true)
  myBoolean!: boolean;
  @number(100)
  myNumber!: number;
  @string('hello')
  myString!: string;
  @array(['defaultStr1', 'defaultStr2'])
  myArray!: string[];
  @ref(null)
  myRef!: { foo: string; bar: string } | null;
}

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
      name: 'add tag component to entity',
      iterations: 1,
      setup: function(ctx: Context) {
        ctx.world = new World();
        ctx.entity = ctx.world.create();
      },
      code: function(ctx: Context) {
        ctx.entity.add(MyTagComponent);
      }
    })
    .add({
      name: 'add tag component to entity - existing archetype',
      iterations: 1,
      setup: function(ctx: Context) {
        ctx.world = new World();
        ctx.world.create().add(MyTagComponent);
        ctx.entity = ctx.world.create();

      },
      code: function(ctx: Context) {
        ctx.entity.add(MyTagComponent);
      }
    })
    .add({
      name: 'add data component to entity - creates archetype',
      iterations: 1,
      setup: function(ctx: Context) {
        ctx.world = new World();
        ctx.entity = ctx.world.create();
      },
      code: function(ctx: Context) {
        (ctx.entity as Entity).add(MyComponentData, {
          myRef: null,
          myNumber: 1,
          myBoolean: false,
          myArray: [],
          myString: 'Oh, Snap!'
        });
      }
    });
}
