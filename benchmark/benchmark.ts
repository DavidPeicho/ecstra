import { performance } from 'perf_hooks';

/**
 * Objects gathering statis on start / stop
 */
class Stats {
  /**
   * Number of iterations performed, used to average values
   *
   * @hidden
   */
  private _count: number;

  /**
   * Number of iterations performed where memory was summed, used to average
   * values
   *
   * @hidden
   */
  private _memCount: number;

  /**
   * Summation of the time spent by each iteration, in ms
   *
   * @hidden
   */
  private _elapsed: number;

  /**
   * Summation of the memory used by each iteration, in bytes
   *
   * @hidden
   */
  private _memory: number;

  /**
   * Start time value, stored on the last call to [[Stats.start]]
   *
   * @hidden
   */
  private _lastTimeStamp: number;

  /**
   * Start memory value, stored on the last call to [[Stats.start]]
   *
   * @hidden
   */
  private _lastMemory: number;

  public constructor() {
    this._count = 0;
    this._memCount = 0;
    this._elapsed = 0.0;
    this._memory = 0.0;
    this._lastTimeStamp = 0.0;
    this._lastMemory = 0.0;
  }

  public start(): void {
    this._lastTimeStamp = performance.now();
    this._lastMemory = process.memoryUsage().heapUsed;
  }

  public stop(): void {
    const time = performance.now() - this._lastTimeStamp;
    const memory = process.memoryUsage().heapUsed - this._lastMemory;

    this._elapsed += time;
    ++this._count;

    // Unfortunately, the garbage collection can automatically occurs before
    // the sample is done. In this case, we simply ignore this iteration memory
    // footprint.
    if (memory >= 0) {
      this._memory += memory;
      ++this._memCount;
    }
  }

  public get average(): number {
    return this._elapsed / this._count;
  }

  public get memoryAverage(): number {
    return this._memory / this._memCount;
  }
}

class BenchmarkGroup {
  private _name: string;
  private _samples: Sample[];

  public constructor(name: string) {
    this._name = name;
    this._samples = [];
  }

  public add(sample: Sample): this {
    this._samples.push(sample);
    return this;
  }

  public get name(): string {
    return this._name;
  }

  public get samples(): Sample[] {
    return this._samples;
  }
}

/**
 * Create and run benchmarks
 */
export class Benchmark {
  /**
   * List of groups created in this benchmark
   *
   * @hidden
   */
  private _groups: Map<string, BenchmarkGroup>;

  /**
   * Called triggered when a sample is starting
   *
   * @hidden
   */
  private _onSampleStart: (sample: Sample) => void;

  /**
   * Called triggered after a sample is completed
   *
   * @hidden
   */
  private _onSampleComplete: (sample: BenchmarkSampleResult) => void;

  public constructor() {
    this._groups = new Map<string, BenchmarkGroup>();
    this._onSampleStart = () => {
      /* Empty. */
    };
    this._onSampleComplete = () => {
      /* Empty. */
    };
  }

  public group(name: string): BenchmarkGroup {
    if (!this._groups.has(name)) {
      this._groups.set(name, new BenchmarkGroup(name));
    }
    return this._groups.get(name)!;
  }

  public onSampleStart(cb: (sample: Sample) => void): this {
    this._onSampleStart = cb;
    return this;
  }

  public onSampleComplete(cb: (sample: BenchmarkSampleResult) => void): this {
    this._onSampleComplete = cb;
    return this;
  }

  public run(): BenchmarkGroupResult[] {
    const benchmarks = [] as BenchmarkGroupResult[];
    this._groups.forEach((group: BenchmarkGroup) => {
      this._runGroup(benchmarks, group);
    });
    return benchmarks;
  }

  private _runGroup(
    results: BenchmarkGroupResult[],
    group: BenchmarkGroup
  ): void {
    const result = {
      name: group.name,
      samples: []
    } as BenchmarkGroupResult;
    results.push(result);

    for (const sample of group.samples) {
      const stats = new Stats();
      const name = sample.name ?? 'unnamed sample';
      const iterations = sample.iterations ?? 25;
      this._onSampleStart({ ...sample, name, iterations });
      for (let i = 0; i < iterations; ++i) {
        let context = {} as Context | null;
        if (sample.setup) {
          sample.setup(context as Context);
        }
        // @todo: add async.
        if (global.gc) {
          global.gc();
        }
        stats.start();
        sample.code(context as Context);
        stats.stop();
        context = null;
      }
      const sampleResult = {
        name,
        iterations,
        average: stats.average,
        memoryAverage: stats.memoryAverage
      };
      this._onSampleComplete(sampleResult);
      result.samples.push(sampleResult);
    }
  }
}

export interface Context {
  [key: string]: any;
}

export interface Sample {
  name?: string;
  iterations?: number;
  setup?: (context: Context) => void;
  code: (context: Context) => void;
}

export interface BenchmarkSampleResult {
  name: string;
  iterations: number;
  average: number;
  memoryAverage: number;
}

export interface BenchmarkGroupResult {
  name: string;
  samples: BenchmarkSampleResult[];
}
