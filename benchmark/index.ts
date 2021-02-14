#!/usr/bin/env node

import { writeFileSync } from 'fs';

import { Benchmark, BenchmarkSampleResult, Sample } from './benchmark.js';
import registerEntityBench from './entity.js';

const benchmark = new Benchmark();
benchmark.onSampleStart((sample: Sample) => {
  console.log(`⚙️\t'${sample.name}': starting`);
});
benchmark.onSampleComplete((sample: BenchmarkSampleResult) => {
  console.log(`\tfinished in ${sample.average.toFixed(3)} ms`);
});

registerEntityBench(benchmark);

writeFileSync('benchmark.json', JSON.stringify({
  benchmarks: benchmark.run()
}, null, 4));
