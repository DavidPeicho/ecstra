import Benchmark from 'benchmark';

import { World } from '../dist/world.js';

export default function(stats) {
  // add tests
  stats
  .add({
    name: 'create / destroy entities with pool',
    onStart: function() {
      this.world = new World({
        useManualPooling: false
      });
      this.entities = new Array(100000);
    },
    fn: function() {
      for (let i = 0; i < 50000; ++i) {
        this.entities[i] = this.world.create();
      }
      for (let i = 0; i < 10000; ++i) {
        this.entities[i].destroy();
        this.entities[i] = this.world.create();
      }
      for (let i = 50000; i < 100000; ++i) {
        this.entities[i] = this.world.create();
      }
      for (let i = 0; i < 100000; ++i) {
        this.entities[i].destroy();
      }
    },
    onCycle: function() {
      this.world = new World();
      this.entities = new Array(100000);
    }
  })
    .add({
      name: 'create / destroy entities without pool',
      onStart: function() {
        this.world = new World();
        this.entities = new Array(100000);
      },
      fn: function() {
        for (let i = 0; i < 50000; ++i) {
          this.entities[i] = this.world.create();
        }
        for (let i = 0; i < 10000; ++i) {
          this.entities[i].destroy();
          this.entities[i] = this.world.create();
        }
        for (let i = 50000; i < 100000; ++i) {
          this.entities[i] = this.world.create();
        }
        for (let i = 0; i < 100000; ++i) {
          this.entities[i].destroy();
        }
      },
      onCycle: function() {
        this.world = new World();
        this.entities = new Array(100000);
      }
  });
}
