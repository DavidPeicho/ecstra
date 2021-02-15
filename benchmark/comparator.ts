#!/usr/bin/env node

import chalk from 'chalk';
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

  let success = true;

  for (const group of sourceList) {
    log(chalk.bold(group.name));
    console.log();
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
      const passed = speedDelta <= 0.0001 && memDelta <= 0.0001;
      if (passed) {
        log(`✅ ${chalk.gray(actualSample.name)}`, 2);
      } else {
        log(`❌ ${chalk.red(actualSample.name)}`, 2);
      }
      if (speedDelta > 0) {
        log(`${chalk.bold(speedDelta.toFixed(4))}ms slower`, 6);
      }
      if (memDelta > 0) {
        log(`${chalk.bold(memDelta.toFixed(2))}ms slower`, 6);
      }
      success = success && passed;
    }
  }

  return success;
}

function log(msg: string, spacing = 0): void {
  console.log(`${' '.repeat(spacing)}${msg}`);
}

interface ComparatorOptions {
  memoryTolerance: number;
  speedTolerance: number;
}
