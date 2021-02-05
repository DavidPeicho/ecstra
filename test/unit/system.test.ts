import test from 'ava';

import { SystemGroup } from '../../src/system-group.js';
import { System } from '../../src/system.js';
import { World } from '../../src/world.js';
import { before, after } from '../../src/decorators.js';

test('SystemGroup > topological sorting', (t) => {
  const world = new World();
  const group = new SystemGroup(world);

  class SystemC extends System {
    execute() {}
  }

  @after([SystemC])
  class SystemD extends System {
    execute() {}
  }

  @after([SystemC])
  @before([SystemD])
  class SystemA extends System {
    execute() {}
  }

  @before([SystemA])
  class SystemB extends System {
    execute() {}
  }

  const a = new SystemA(group, {});
  const b = new SystemB(group, {});
  const c = new SystemC(group, {});
  const d = new SystemD(group, {});
  group.add(a);
  group.add(b);
  group.add(c);
  group.add(d);
  t.deepEqual(group['_systems'], [a, b, c, d]);
  group.sort();
  t.deepEqual(group['_systems'], [c, b, a, d]);
});

test('SystemGroup > topological sorting cycle', (t) => {
  const world = new World();
  const group = new SystemGroup(world);

  class SystemC extends System {
    execute() {}
  }

  @after([SystemC])
  class SystemD extends System {
    execute() {}
  }

  @after([SystemD])
  @before([SystemC])
  class SystemA extends System {
    execute() {}
  }
  const a = new SystemA(group, {});
  const c = new SystemC(group, {});
  const d = new SystemD(group, {});
  group.add(c);
  group.add(a);
  group.add(d);
  t.deepEqual(group['_systems'], [c, a, d]);
  group.sort();
  // In the case of a cycle, the final ordering will be dependant on the
  // insert order.
  t.deepEqual(group['_systems'], [c, d, a]);
});

test('SystemGroup > ordering', (t) => {
  const world = new World();
  const group = new SystemGroup(world);

  class SystemA extends System {
    execute() {}
  }
  class SystemB extends System {
    execute() {}
  }
  class SystemC extends System {
    execute() {}
  }
  const a = new SystemA(group, { order: -100 });
  const c = new SystemC(group, { order: 1 });
  const b = new SystemB(group, { order: 200 });
  group.add(b);
  group.add(a);
  group.add(c);
  t.deepEqual(group['_systems'], [b, a, c]);
  group.sort();
  t.deepEqual(group['_systems'], [a, c, b]);
});
