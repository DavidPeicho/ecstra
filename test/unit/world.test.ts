import test from 'ava';
import { SystemGroup } from '../../src/system-group.js';
import { System } from '../../src/system.js';
import { World } from '../../src/world.js';
import { spy } from './utils.js';

test('World > System > register', (t) => {
  class MySystem extends System {
    execute() {}
    init = spy();
  }
  const world = new World();
  world.register(MySystem);
  const sys = world.system(MySystem)!;

  t.true(!!sys);
  t.is(sys.group.constructor, SystemGroup);
  t.true(sys.init.called);
});

test('World > System > register with group', (t) => {
  class MySystem extends System {
    execute() {}
  }
  class MyOtherSystem extends System {
    execute() {}
  }
  class MyGroup extends SystemGroup {}
  class MyOtherGroup extends SystemGroup {}

  const world = new World();
  world
    .register(MySystem, { group: MyGroup })
    .register(MyOtherSystem, { group: MyOtherGroup });
  t.is(world.system(MySystem)!.group.constructor, MyGroup);
  t.is(world.system(MyOtherSystem)!.group.constructor, MyOtherGroup);
});

test('World > System > retrieve', (t) => {
  class MySystem extends System {
    execute() {}
  }
  const world = new World();
  world.register(MySystem);
  t.is(world.system(MySystem)!.constructor, MySystem);
});

test('World > SystemGroup > retrieve', (t) => {
  class MySystem extends System {
    execute() {}
  }
  class MyGroup extends SystemGroup {}
  const world = new World();
  world.register(MySystem, { group: MyGroup });
  t.is(world.system(MySystem)!.group.constructor, MyGroup);
});

test('World > System > unregister', (t) => {
  class MySystem extends System {
    execute() { /** Empty. */ }
    dispose = spy();
  }
  class MyGroup extends SystemGroup {}

  const world = new World();
  world.register(MySystem, { group: MyGroup });

  const system = world.system(MySystem)!;
  const group = world.group(MyGroup)!;

  t.true(!!world.system(MySystem)!);
  t.is(system.group.constructor, MyGroup);

  world.unregister(MySystem);
  t.false(!!world.system(MySystem)!);
  t.is(group['_systems'].indexOf(system), -1);
  t.is(world.group(MyGroup), undefined);
  t.true(system.dispose.called);
});
