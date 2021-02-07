# World

The `World` is the data structure holding all entities, as well as all the systems. In order to create entities and add components to them, you will need to create a world first.

## Creation

```js
import { World } from 'flecs';

const world = new World();
```

You can also change the configuration of the world:

```js
const world = new World({
  systems, // List of default systems
  maxComponentType, // Maximum number of component registered
  useManualPooling, // If `true`, user need to manage memory pools
  EntityClass // Entity class to instanciate on entity creation
);
```

> You can read the API section to get all the information about the world.

## Registration

You must register every system you want to run:

```js
world.register(MySystemClass, {
  ... // System options
});
```

It's possible to register a system at any time. However, registering
a system comes at the cost of pre-computing static queries. Doing the
registration early can be benefitial.

# Entities

Entities should be created using a world:

```js
const entity = world.create('nameOfTheEntity');
```

> Entities belong to a given world and can't be exchange / shared between two world instances.

Destroying an entity at the opposite can be done directly on the entity
itself:

```js
entity.destroy();
```

You must add component to entity in order to query them in systems:

```js
entity.addComponent(MyComponent, {
  ... // Component options
});
```

## Retrieving & Deleting Components

If you plan on reading a component, please use

```js
import { ComponentData, StringProp } from 'flecs';

class MyComponent extends ComponentData {}

MyComponent.Properties = {
    myString: StringProp('Hello World!')
};

const component = entity.read(MyComponent);
console.log(component.myString); // 'Hello World!'
```

You can also retrieve a component in read-write mode

```js
const component = entity.write(MyComponent);
component.myString = 'Hello Flecs!';
console.log(component.myString); // 'Hello Flecs!'
```

> NOTE: Right now, reading a component as read-only or as read-write
> doesn't d **anything**. The idea is to introduce soon a way to improve
> query with this information.

When you are done with a component, you can get rid of it by using:

```js
entity.remove(MyComponent);
```

If you often create and destroy components, consider using
pooling to increase performance. For more information, please have
a look at the ['Pooling' section](#pooling).

# Components

Components contain data attached to entity and used by systems to
apply logic on those entities. `flecs` exposes several type of components that will serve different purposes.

## ComponentData

Components deriving `ComponentData` can use the automatic initialization and copy of components. `ComponentData` can declare a property schema and the component will be initialized automatically.

```js
import { ComponentData, NumberProp } from 'flecs';

class HealthComponent extends ComponentData {}

HealthComponent.Properties = {
  value: NumberProp(100) // 100 is a default value
};

const component = new HealthComponent();
console.log(component.value); // '100'
```

> Note: TypeScript users can declare propertiess with [decorators](#decorators).

The `DataComponent` class exposes a simple interface:

```js
export class Component {
  init(source) {}
  copy(source) {}
  clone() {}
}
```

* `init()` ⟶ initialize the component with an object containing the same
properties. Missing properties will default to the default value set in the `Properties` schema
* `copy(source)` ⟶ Copies the data from the source object, i.e: the same
kind of component or an object with the same properties
* `clone()` ⟶ Returns a new instance of the object with the same properties

Thankfully, you will not need to override those methods if you use the `Properties` schema. Those methods will automatically use the properties definition in order to know how to initialize and copy the component.

`flecs` already comes with a few basic property types:

* `BooleanProp` ⟶ Defaults to `false`
* `NumberProp` ⟶ Defaults to `0`
* `StringProp` ⟶ Defaults to `''`
* `ArrayProp` ⟶ Defaults to `[]`
* `RefProp`
  * Use it to store reference to object
  * Defaults to `null`
* `CopyableProp`
  * Use it on types implementing `copy()` and `clone()`
  * Defaults to `new type()`, with `type` a given class

For more information about how to create a custom property, please have a look at the ['Custom Properties' section](#custom-properties).

## TagComponent

Tags are special kind of components. They hold no data and are used to select entity in queries.

```js
class PlayerTagComponent extends TagComponent {}
```

You can then attach this component to a _"player"_ entity. This tag
component will allow you to select the player in systems and performs
custom logic.

## SingletonComponent

Coming soon.

# Systems & Queries

Systems are run when the world ticks. They are schedule to run one after
the other, one group at a time. Running systems can query entities based on the components they hold.

## Example

```js
import { NumberProp, System } from 'fecs';

class TransformComponent extends ComponentData { }
TransformComponent.Properties = {
  x: NumberProp(), // Defaults to 0.
  y: NumberProp(), // Defaults to 0.
};


class SpeedComponent extends ComponentData { }
SpeedComponent.Properties = {
  value: NumberProp(150.0)
};

class PhysicsSystem extends System {

  execute(delta) {
    // `query` contains **every** entity that has at least the
    // components `SpeedComponent` and `TransformComponent`.
    const query = this.queries.entitiesWithBox;
    // Loops over every entity.
    query.execute((entity) => {
      const transform = entity.write(TransformComponent);
      const speed = entity.read(SpeedComponent);
      transform.y = Math.max(0.0, transform.y - speed.value * delta);
    });
  }

}
PhysicsSystem.Queries = {
  entitiesWithBox: [ SpeedComponent, TransformComponent ]
};
```

The `execute()` method is automatically called. This is where most (all if possible) of your logic should happen.

The `Queries` static properties list all the queries you want to
cache. Queries are created when the system is instantiated, and are
cached until the system is unregistered.

Queries can also specify that they want to deal with entities that
**do not** have a given component:

```js
import { Not } from 'fecs';

PhysicsSystem.Queries = {
  entitiesWithBoxThatArentPlayers: [
    SpeedComponent,
    TransformComponent,
    Not(PlayerComponent)
  ]
};
```

## Order

### Topological

It's possible to declare relation between system of a same group. Then, the
group will be sorted based on those relations. Currently, it's possible to
define hierarchies using:

* `UpdateBefore(list)` ⟶ the system will run **before** all other systems listed
* `UpdateAfter(list)` ⟶ the system will run **after** all other systems listed

```js
import { System } from 'flecs';

class SystemA extends System {
  execute() {}
}
SystemA.UpdateAfter = [ SystemC, SystemB ];

class SystemB extends System {
  execute() {}
}
class SystemC extends System {
  execute() {}
}
SystemC.UpdateBefore = [ SystemA ];
SystemC.UpdateAfter = [ SystemB ];
```

The group will automatically be sorted using those relations and will the final
group will be `[ SystemB, SystemC, SystemA ]`.

### Index-based

Sorting topologically is nice, but you may want to change ordering after the
world is setup with a simple priority system.

Systems can be registered with an order that define the position of execution:

```js
world.register(SystemB, { order: 0 });
world.register(SystemC, { order: 1 });
world.register(SystemA, { order: 2 });
```

### Notes

At any time, you can change the ordering of systems either by modifying the
`order` attribute, or even by modifying the static `UpdateBefore` and
`UpdateAfter` properties (not recommended).

You will simply need to retrieve the group and call the `sort()` method to
ask for a refresh order of the list:

```js
const system = world.system(SystemC);
system.order = 10;
system.group.sort();

```

# Decorators

## ComponentData

For TypeScript users, it's possible to use decorators to declare the properties:

```ts
class TestComponentDecorator extends ComponentData {
  @boolean
  myBoolean: boolean = true;

  @number
  myNumber: number = 10;

  @string
  myString: string = 'my string!';

  @array
  myStringArray: string[] = [];

  @reference
  myRef: Object | null = null;
}
```

# Advanced

## Custom Properties

You can create your own properties by extending the `Property` class:

```js
import { Property } from 'property';

class MyProperty extends Property {

  copy(dest, src) {
    // Optional method to implement.
    // `dest` should receive the value (for reference type).
    // `src` is the input.
    return dest;
  }

}
```

You can also create a function that setup your property:

```js
function MyProp(options) {
  // Process the `options` argument and create the property.
  return new MyProperty(...);
}
```

## Pooling

When creating and destroying a lot of entities and components, pooling
can help reduce garbage collection and improve general performance.

> Note By default, worlds are created in _"manual"_ pooling mode, i.e., no pooling is performed.

### Automatic Pooling

It's possible for you to activate pooling with little effort:

```js
const world = new World({ useManualPooling: false });
```

Pooling will be enabled for **every** components, as well as for
entities.

It's possible for you to opt out pooling for the desired components:

```js
// The second argument represents the pool. Setting it to `null`
// disable pooling.
world.setComponentPool(MyComponentClass, null);
```

### Manual Pooling

Instead of using automatic pooling, it's possible to manage pools
one by one. You can assign a pool to a component type:

```js
import { DefaultPool } from 'flecs';

world.setComponentPool(MyComponentClass, new DefaultPool());
```

You can also derive your own pool implementation by creating a class
matching this interface:

```js
export interface ObjectPool<T> {
  destroy?: () => void;
  acquire(): T;
  release(value: T): void;
  expand(count: number): void;
}
```

## API

Please have a look at the [generated API]() (coming soon).

