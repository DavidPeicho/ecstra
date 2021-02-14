#!/usr/bin/env node

import { promises } from 'fs';
import { BenchmarkGroupResult, BenchmarkSampleResult } from './benchmark';

export function compare(
  sourceList: BenchmarkGroupResult[],
  actualList: BenchmarkGroupResult[],
  options: Partial<ComparatorOptions> = {}
): boolean {
  let { memoryTolerance = 0.025, speedTolerance = 0.025 } = options;

  memoryTolerance += 1.0;
  speedTolerance += 1.0;

  const actual = new Map() as Map<string, BenchmarkSampleResult>;
  for (const group of actualList) {
    for (const sample of group.samples) {
      actual.set(sample.name, sample);
    }
  }

  for (const group of sourceList) {
    for (const srcSample of group.samples) {
      const actualSample = actual.get(srcSample.name)!;
      let speedDelta = 0;
      let memDelta = 0;
      if (actualSample.average > speedTolerance * srcSample.average) {
        speedDelta = actualSample.average - srcSample.average;
      }
      if (
        actualSample.memoryAverage >
        memoryTolerance * srcSample.memoryAverage
      ) {
        memDelta = actualSample.memoryAverage - srcSample.memoryAverage;
      }
      console.log(`⚙️\t'${actualSample.name}'`);
      if (speedDelta > 0) {
        console.log(`\t\t📉 ${speedDelta.toFixed(4)}ms slower`);
      }
      if (memDelta > 0) {
        console.log(`\t\t🪶 ${memDelta.toFixed(2)}bytes heavier`);
      }
      console.log();
    }
  }

  return true;
}

function errorAndExit(msg: string): void {
  console.error(msg);
  process.exit(1);
}

interface ComparatorOptions {
  memoryTolerance: number;
  speedTolerance: number;
}

/**
 * CLI argument parsing
 */

const sourceIndex = process.argv.findIndex(
  (v: string) => v === '--source' || v === '-s'
);
if (sourceIndex + 1 >= process.argv.length) {
  errorAndExit('source not provided');
}
const actualIndex = process.argv.findIndex(
  (v: string) => v === '--actual' || v === '-a'
);
if (actualIndex + 1 >= process.argv.length) {
  errorAndExit('actual not provided');
}

Promise.all([
  promises.readFile(process.argv[sourceIndex + 1], 'utf8'),
  promises.readFile(process.argv[actualIndex + 1], 'utf8')
]).then((files: string[]) => {
  const source = JSON.parse(files[0]) as { benchmarks: BenchmarkGroupResult[] };
  const actual = JSON.parse(files[1]) as { benchmarks: BenchmarkGroupResult[] };
  compare(source.benchmarks, actual.benchmarks);
});
