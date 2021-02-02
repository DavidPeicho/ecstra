## World

The `World` is the data structure holding all entities, as well as all the systems.

In order to create entities and add components to them, you will need to
create a world:

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

You must register every system you want to run:

```js
world.register(MySystemClass, {
  ... // System options
});
```

It's possible to register a system at any time. However, registering
a system comes at the cost of pre-computing static queries. Doing the
registration early can be benefitial.

## Entities

Entities should be created using a world;

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

### Retrieving & Deleting Components

If you plan on reading a component, please use

```js
import { ComponentData, StringProp } from 'flecs';

class MyComponent extends ComponentData {}

MyComponent.Properties = {
    myString: new StringProp('Hello World!')
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

## Components

Components contain data attached to entity and used by systems to
apply logic on those entities. `flecs` exposes several type of components that will serve different purposes.

### ComponentData

Components deriving `ComponentData` can use the automatic initialization and copy of components. `ComponentData` can declare a property schema and the component will be initialized automatically.

```js
import { ComponentData, NumberProp } from 'flecs';

class HealthComponent extends ComponentData {}

HealthComponent.Properties = {
  value: new NumberProp(100) // 100 is a default value
};

const component = new HealthComponent();
console.log(component.value); // '100'
```

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
* `CopyProp`
  * Use it on types implementing `copy()` and `clone()
  * Defaults to `new type()`, with `type` a given class

For more information about how to create a custm property, please have a look at the ['Custom Properties' section](#custom-properties).

#### Decorators

### TagComponent

## Systems & Queries

## Advanced

### Custom Properties

### Pooling

## API

Please have a look at the [generated API]().

