import { Context, Benchmark } from './benchmark.js';

import { boolean, number, array, string, ref } from '../src/decorators.js';
import { ComponentData, TagComponent } from '../src/component.js';
import { World } from '../src/world.js';
import { System } from '../src/system.js';

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

export default function (benchmark: Benchmark): void {
  benchmark
    .group('Entity')
    .add({
      name: 'create / destroy entities without pool',
      iterations: 5,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: true });
        ctx.entities = new Array(100000).fill(null);
      },
      code: function (ctx: Context) {
        const len = ctx.entities.length;
        for (let i = 0; i < Math.floor(len / 3); ++i) {
          ctx.entities[i] = ctx.world.create();
        }
        for (let i = 0; i < Math.floor(len / 4); ++i) {
          ctx.entities[i].destroy();
          ctx.entities[i] = null;
        }
        for (let i = 0; i < len; ++i) {
          if (ctx.entities[i] === null) {
            ctx.entities[i] = ctx.world.create();
          }
        }
      }
    })
    .add({
      name: 'create / destroy entities with pool',
      iterations: 5,
      setup: function (ctx: Context) {
        ctx.world = new World({
          useManualPooling: false
        });
        ctx.entities = new Array(100000);
      },
      code: function (ctx: Context) {
        const len = ctx.entities.length;
        for (let i = 0; i < Math.floor(len / 3); ++i) {
          ctx.entities[i] = ctx.world.create();
        }
        for (let i = 0; i < Math.floor(len / 4); ++i) {
          ctx.entities[i].destroy();
          ctx.entities[i] = null;
        }
        for (let i = 0; i < len; ++i) {
          if (ctx.entities[i] === null) {
            ctx.entities[i] = ctx.world.create();
          }
        }
      }
    })
    .add({
      name: 'add tag component to entity - no pooling',
      iterations: 100,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: true });
        ctx.world.registerComponent(MyTagComponent);
        ctx.entity = ctx.world.create();
      },
      code: function (ctx: Context) {
        ctx.entity.add(MyTagComponent);
      }
    })
    .add({
      name: 'add tag component to entity - pooling',
      iterations: 100,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: false });
        ctx.world.registerComponent(MyTagComponent);
        ctx.entity = ctx.world.create();
      },
      code: function (ctx: Context) {
        ctx.entity.add(MyTagComponent);
      }
    })
    .add({
      name: 'remove tag component synchronously from entity',
      iterations: 100,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: true });
        ctx.world.registerComponent(MyTagComponent);
        ctx.entity = ctx.world.create();
        ctx.entity.add(MyTagComponent);
      },
      code: function (ctx: Context) {
        ctx.entity.remove(MyTagComponent);
      }
    })
    .add({
      name: 'add data component to entity - no pooling',
      iterations: 100,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: true });
        ctx.world.registerComponent(MyComponentData);
        ctx.entity = ctx.world.create();
      },
      code: function (ctx: Context) {
        ctx.entity.add(MyComponentData, {
          myBoolean: false,
          myNumber: 1,
          myString: 'Oh, Snap!',
          myArray: [],
          myRef: null
        });
      }
    })
    .add({
      name: 'add data component to entity - pooling',
      iterations: 100,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: false });
        ctx.world.registerComponent(MyComponentData);
        ctx.entity = ctx.world.create();
      },
      code: function (ctx: Context) {
        ctx.entity.add(MyComponentData, {
          myBoolean: false,
          myNumber: 1,
          myString: 'Oh, Snap!',
          myArray: [],
          myRef: null
        });
      }
    });

  (function () {
    class MySystem extends System {
      execute() {
        /* Emnpty. */
      }
    }
    MySystem.Queries = {};
    for (let i = 0; i < 100000; ++i) {
      MySystem.Queries[`query_${i}`] = [MyTagComponent];
    }

    benchmark.group('Entity').add({
      name: 'add tag component to entity - several queries',
      iterations: 100,
      setup: function (ctx: Context) {
        ctx.world = new World({ useManualPooling: true });
        ctx.world.register(MySystem);
        ctx.world.registerComponent(MyTagComponent);
        ctx.entity = ctx.world.create();
      },
      code: function (ctx: Context) {
        ctx.entity.add(MyTagComponent);
      }
    });
  })();
}
