#!/usr/bin/env node

import { writeFileSync } from 'fs';

import { Benchmark } from './benchmark.js';
import registerEntityBench from './entity.js';

const benchmark = new Benchmark();
registerEntityBench(benchmark);

writeFileSync('benchmark.json', JSON.stringify({
  benchmarks: benchmark.run()
}, null, 4));
