#!/usr/bin/env node

import { writeFileSync } from 'fs';

import Benchmark from 'benchmark';
import registerEntityBench from './entity.js';

class Stats {

  constructor() {
    this._suite = new Benchmark.Suite();
    this._suite.on('complete', (event) => {
      this.dump();
    });
    this._results = [];
  }

  add(bench) {
    bench.onComplete = (event) => {
      // console.log(event);
      const times = event.target.times;
      this._results.push({
        name: event.target.name,
        cycleTime: times.cycle,
        elapsedTime: times.elapsed
      })
    };
    this._suite.add(bench);
    return this;
  }

  run() {
    this._suite.run();
  }

  dump() {
    writeFileSync('result.json', JSON.stringify({
      benchmarks: this._results
    }, null, 4));
  }

}

const stats = new Stats();
registerEntityBench(stats);

stats.run();
