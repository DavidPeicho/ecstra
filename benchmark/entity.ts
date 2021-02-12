import { Benchmark } from "./benchmark";

export default function(benchmark: Benchmark) {
  benchmark
    .group('Entity')
    .add({
      name: 'create / destroy entities with pool',
      code: function() {
        
      }
    });
}
