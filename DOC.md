# World

The `World` is the data structure holding all entities, as well as all the systems. In order to create entities and add components to them, you will need to create a world first.

## Creation

```js
import { World } from 'ecstra';

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
import { ComponentData, StringProp } from 'ecstra';

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
component.myString = 'Hello Ecstra!';
console.log(component.myString); // 'Hello Ecstra!'
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
apply logic on those entities. Ecstra exposes several type of components that will serve different purposes.

## ComponentData

Components deriving `ComponentData` can use the automatic initialization and copy of components. `ComponentData` can declare a property schema and the component will be initialized automatically.

```js
import { ComponentData, NumberProp } from 'ecstra';

class HealthComponent extends ComponentData {}

HealthComponent.Properties = {
  value: NumberProp(100) // 100 is a default value
};

const component = new HealthComponent();
console.log(component.value); // '100'
```

> NOTE: TypeScript users can declare propertiess with [decorators](#decorators).

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

Ecstra already comes with a few basic property types:

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

# Systems

Systems are run when the world ticks. They are scheduled to run one after
the other, one group at a time. Systems can query entities based on the components they hold.

```js
import { System } from 'ecstra';

class PhysicsSystem extends System {

  init() {
    // Triggered on initialization. Note: you can also use the
    // constructor for that.
  }

  execute(delta) {
    // Performs update logic here.
  }

  dispose() {
    // Triggered when system is removed from the world.
  }

}
```

Systems have the following lifecycle:
* `init()` → Triggered upon system instanciation in the world
* `execute()` → Triggered when the world execute
* `dispose()` → Triggered when system is destroyed by the world

## Order

### Topological

It's possible to declare relation between system of a same group. Then, the
group will be sorted based on those relations. Currently, it's possible to
define hierarchies using:

* `UpdateBefore(list)` ⟶ the system will run **before** all other systems listed
* `UpdateAfter(list)` ⟶ the system will run **after** all other systems listed

```js
import { System } from 'ecstra';

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

# Queries

System may have a `Queries` static properties that list all the queries you want to
cache. Queries are created upon system instanciation, and are
cached until the system is unregistered.

```js
import { NumberProp, System } from 'ecstra';

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
// The static property `Queries` list the query you want to automatically
// create with the system.
PhysicsSystem.Queries = {
  // The `entitiesWithBox` matches every entity with the `SpeedComponent` and
  // `TransformComponent` components.
  entitiesWithBox: [ SpeedComponent, TransformComponent ]
};
```

## Operators

### Not

Queries can also specify that they want to deal with entities that
**do not** have a given component:

```js
import { Not } from 'ecstra';

...

PhysicsSystem.Queries = {
  // Matches entities with `SpeedComponent` and `TransformComponent but
  // without `PlayerComponent`.
  entitiesWithBoxThatArentPlayers: [
    SpeedComponent,
    TransformComponent,
    Not(PlayerComponent)
  ]
};
```

## Events

A query will notifiy when a new entity is matching its component
layout:

```js
class MySystem extends System {

  init() {
    this.queries.myQuery.onEntityAdded = () => {
      // Triggered when a new entity matches the component layout of the
      // query `myQuery`.
    };
    this.queries.myQuery.onEntityRemoved = () => {
      // Triggered when an entity that was previously matching query isn't
      // matching anymore.
    };
  }

}
MySystem.Queries = {
  myQuery: [ ... ]
}
```

You can use those two events to perform initialization and disposal of
resources.

### Events Order

Those events are **synchronous** and can be called in **any** order. If you
have two queries, never assumes the `onEntityAdded` and `onEntityRemoved` events
of one will be triggered before the other.

> NOTE: the current behaviour could be later changed in the library if
> events **must** be based on the systems execution order.

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

# Pooling

The first version of Ecstra had pooling disabled by default. However, when I
started to benchmark the library I quickly realized that pooling was a must have
by default.

By default, every component type and entities have associated pools. If you have
50 different components, Ecstra will then allocates 50 component pools and one
extra pool for entities. This may seem like a waste of memory, but will bring
by ~50% the cost of creating components and entities.

## Custom Pool

You can derive your own pool implementation by creating a class
matching this interface:

```js
export interface ObjectPool<T> {
  destroy?: () => void;
  acquire(): T;
  release(value: T): void;
  expand(count: number): void;
}
```

You can then use your own default pool for entities / components:

```js
const world = new World({
  ComponentPoolClass: MySuperFastPoolClass,
  EntityPoolClass: MySuperFastPoolClass
});
```

Alternatively, you can change the pool on a per-component basis using:

```js
world.registerComponent(MyComponentClass, { pool: MySuperFastPoolClass });
```

or

```js
world.setComponentPool(MyComponentClass, MySuperFastPoolClass);
```

## Disable Automatic Pooling

If you don't want any default pooling, you can create your `World` using:

```js
const world = new World({
  useManualPooling: true
})
```

When the automatic pooling is disabled, `ComponentPoolClass` and
`EntityPoolClass` are unused. However, manually assigning pool using
`world.setComponentPool` is still a possibility.

# Perfomance

## Pooling

Pooling can significantly improve performance, especially if you often add or
remove components. The default pooling scheme should be enough in most cases,
but creating custom pool systems can also help.

## Reduce Componet Addition / Deletion

Even if pooling is used, adding / deleting components always comes at a cost.
The components list is hashed into a string, used to find the new archetype
of the entity.

You can probably enabled / disable some components by using a custom field.

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

## API

Please have a look at the [generated API]() (coming soon).

