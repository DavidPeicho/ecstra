#!/usr/bin/env node

import { writeFileSync } from 'fs';

import { Benchmark, BenchmarkSampleResult, Sample } from './benchmark.js';
import registerEntityBench from './entity.js';

/**
 * CLI argument parsing
 */

const benchmark = new Benchmark();
benchmark.onSampleStart((sample: Sample) => {
  console.log(`⚙️\t'${sample.name}'`);
});
benchmark.onSampleComplete((sample: BenchmarkSampleResult) => {
  console.log(`\tfinished in ${sample.average.toFixed(3)} ms`);
});

registerEntityBench(benchmark);

const benchmarks = benchmark.run();

const date = new Date().toLocaleDateString().replace(/\//g, '_');
writeFileSync(
  `benchmark-${date}.json`,
  JSON.stringify(
    {
      benchmarks
    },
    null,
    4
  )
);
