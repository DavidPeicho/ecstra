#!/usr/bin/env node

import { writeFileSync } from 'fs';

import { Benchmark, BenchmarkSampleResult, Sample } from './benchmark.js';
import registerEntityBench from './entity.js';

/**
 * CLI argument parsing.
 */

const args = {
  output: `benchmark-${new Date().toLocaleDateString().replace(/\//g, '_')}.json`
};

const outputIndex = process.argv.findIndex(
  (v: string) => v === '--output' || v === '-o'
);
if (outputIndex + 1 < process.argv.length) {
  args.output = process.argv[outputIndex + 1];
}

/**
 * Main.
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
const benchmarksJSON = JSON.stringify({ benchmarks }, null, 4);
writeFileSync(args.output, benchmarksJSON);
