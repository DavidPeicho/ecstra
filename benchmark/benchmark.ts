class Stats {

  private _count: number;
  private _elapsed: number;
  private _min: number;
  private _max: number;
  private _lastTimeStamp: number;

  public constructor() {
    this._count = 0;
    this._elapsed = 0.0;
    this._lastTimeStamp = 0.0;
    this._min = Number.POSITIVE_INFINITY;
    this._max = Number.NEGATIVE_INFINITY;
  }

  public start(): void {
    this._lastTimeStamp = performance.now();
  }

  public stop(): void {
    const time = performance.now() - this._lastTimeStamp;
    this._elapsed += time;
    ++this._count;
  }

  public get average(): number {
    return this._elapsed / this._count;
  }

  public get min(): number {
    return this._min;
  }

  public get max(): number {
    return this._max;
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

export class Benchmark {

  private _groups: Map<string, BenchmarkGroup>;

  public constructor() {
    this._groups = new Map<string, BenchmarkGroup>();
  }

  public group(name: string): BenchmarkGroup {
    if (!this._groups.has(name)) {
      this._groups.set(name, new BenchmarkGroup(name));
    }
    return this._groups.get(name)!;
  }

  public run(): void {
    const results = [] as BenchmarkGroupResult[];
    this._groups.forEach((group: BenchmarkGroup) => {
      this._runGroup(results, group)
    });
  }

  private _runGroup(results: BenchmarkGroupResult[], group: BenchmarkGroup): void {
    const result = {
      name: group.name,
      samples: []
    } as BenchmarkGroupResult;
    results.push(result);

    for (const sample of group.samples) {
      const stats = new Stats();
      const iterations = sample.iterations ?? 10;
      for (let i = 0; i < iterations; ++i) {
        const context = {};
        if (sample.setup) {
          sample.setup(context);
        }
        // @todo: add async.
        stats.start();
        sample.code(context);
        stats.stop();

        if (global.gc) {
          global.gc();
        }
      }
      result.samples.push({
        name: sample.name ?? 'unnamed sample',
        average: stats.average,
        min: stats.min,
        max: stats.max
      });
    }
  }

}

interface Context {
  [ key: string ]: any;
}

interface Sample {
  name?: string;
  iterations?: number;
  setup?: (context: Context) => void;
  code: (context: Context) => void;
}

interface BenchmarkSampleResult {
  name: string;
  average: number;
  min: number;
  max: number;
}

interface BenchmarkGroupResult {
  name: string;
  samples: BenchmarkSampleResult[];
}
