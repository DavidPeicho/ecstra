#!/usr/bin/env node

import chalk from 'chalk';

import { promises as fsp } from 'fs';

import {
  Benchmark,
  BenchmarkGroupResult,
  BenchmarkSampleResult
} from './benchmark.js';
import { compare } from './comparator.js';
import registerEntityBench from './entity.bench.js';

/**
 * CLI argument parsing.
 */

const argv = process.argv;
const args = {
  output: null as string | null,
  compare: null as string | null
};

const outputIndex = argv.findIndex((v) => v === '--output' || v === '-o');
if (outputIndex >= 0 && outputIndex + 1 < process.argv.length) {
  args.output = process.argv[outputIndex + 1];
}
const compareIndex = argv.findIndex((v) => v === '--compare' || v === '-c');
if (compareIndex >= 0 && compareIndex + 1 < process.argv.length) {
  args.compare = process.argv[compareIndex + 1];
}

/**
 * Main.
 */

const benchmark = new Benchmark();
benchmark.onSampleComplete((sample: BenchmarkSampleResult) => {
  const avg = sample.average;
  const avgStr = `${chalk.white.bold(sample.average.toFixed(4))}ms`;
  if (avg > 3.0) {
    console.log(`${chalk.red(sample.name)} ${avgStr}`);
  } else if (avg > 1.0) {
    console.log(`${chalk.yellow(sample.name)} ${avgStr}`);
  } else if (avg > 0.15) {
    console.log(`${chalk.gray(sample.name)} ${avgStr}`);
  } else {
    console.log(`${chalk.green(sample.name)} ${avgStr}`);
  }
});

registerEntityBench(benchmark);

console.log();
console.log(chalk.white.bold(`--- starting benchmark ---`));
console.log();

const benchmarks = benchmark.run();
const promises = [];

if (args.output !== null) {
  const benchmarksJSON = JSON.stringify({ benchmarks }, null, 4);
  const p = fsp
    .writeFile(args.output, benchmarksJSON)
    .then(() => 0)
    .catch((e) => {
      console.error(e);
      return 1;
    });
  promises.push(p);
}

if (args.compare !== null) {
  console.log();
  console.log(chalk.white.bold(`--- comparing to '${args.compare}' ---`));
  console.log();
  const p = fsp.readFile(args.compare as string, 'utf8').then((v: string) => {
    const source = JSON.parse(v) as { benchmarks: BenchmarkGroupResult[] };
    const success = compare(source.benchmarks, benchmarks);
    return success ? 0 : 1;
  });
  promises.push(p);
}

Promise.all(promises).then((exitCodes: number[]) => {
  for (const code of exitCodes) {
    if (code !== 0) {
      process.exit(code);
    }
  }
  console.log();
  if (args.output) {
    console.log(chalk.white(`benchmark results written to '${args.output}'`));
  }
});
