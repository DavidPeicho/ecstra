# Ecstra

[![Build Status](https://travis-ci.com/DavidPeicho/ecstra.svg?branch=main)](https://travis-ci.com/DavidPeicho/ecstra)


> 🚧 Ecstra is a work-in-progress and might be unstable, use it at your
> own risks 🚧

Fast & Flexible EntityComponentSystem (ECS) for JavaScript and Typescript, available in browser and Node.js.

Get started with:
* The [Documentation](./DOC.md)
* The [JavaScript Examples](./example)
* The [TypeScript Examples](./example/typescript)

> 🔍 I am currently looking for people to help me to identify their needs in order to drive the development of this [library further](#stable-version).

<p align="center">
  <img src="./example.gif">
</p>

## Philosophy

> Created as 'Flecs', it's been renamed to 'Ecstra' to avoid duplicate

Ecstra (pronounced as "extra") is heavily based on [Ecsy](https://github.com/ecsyjs/ecsy), but mixes concepts from other great ECS. It also share some concepts with
[Hecs](https://github.com/gohyperr/hecs/).

My goals for the library is to keep it:

* 💻 Framework Agnostic 💻
* 🪶 Lightweight 🪶
* ⚡ Fast ⚡
* 🏋️ Robust 🏋️

The library will prioritize stability improvements over feature development.

## Features

* Easy To Use Query Language
* System Grouping
* System Topological Sorting
* Automatic Component Registration
* Component Properties Merging
* System Queries Merging
* TypeScript Decorators
  * For component properties
  * For system ordering and configuration
* No Dependency

## Install

Using npm:

```sh
npm install ecstra
```

Using yarn

```sh
yarn add ecstra
```

The library is distributed as an ES6 module, but also comes with two UMD builds:
* `fecs/umd/fecs.js` → Development build with debug assertions
* `fecs/umd/fecs.min.js` → Minified production build, without  debug assertions

## Usage Example

### TypeScript

```ts
import {
  ComponentData,
  TagComponent,
  System,
  World,
  number,
  queries,
  ref
} from 'ecstra';

/**
 * Components definition.
 */

class Position2D extends ComponentData {
  @number()
  x!: number;
  @number()
  y!: number;
}

class FollowTarget extends ComponentData {
  @ref()
  target!: number;
  @number(1.0)
  speed!: number;
}

class PlayerTag extends TagComponent {}
class ZombieTag extends TagComponent {}

/**
 * Systems definition.
 */

@queries({
  // Select entities with all three components `ZombieTag`, `FollowTarget`, and
  // `Position2D`.
  zombies: [ZombieTag, FollowTarget, Position2D]
})
class ZombieFollowSystem extends System {

  execute(delta: number): void {
    this.queries.zombies.execute((entity) => {
      const { speed, target } = entity.read(FollowTarget);
      const position = entity.write(Position2D);
      const deltaX = target.x - position.x;
      const deltaY = target.y - position.y;
      const len = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (len >= 0.00001) {
        position.x += speed * delta * (deltaX / len);
        position.y += speed * delta * (deltaY / len);
      }
    });
  }

}

const world = new World().register(ZombieFollowSystem);

// Creates a player entity.
const playerEntity = world.create().add(PlayerTag).add(Position2D);
const playerPosition = playerEntity.read();

// Creates 100 zombies at random positions with a `FollowTarget` component that
// will make them follow our player.
for (let i = 0; i < 100; ++i) {
  world.create()
    .add(ZombieTag)
    .add(Position2D, {
      x: Math.floor(Math.random() * 50.0) - 100.0,
      y: Math.floor(Math.random() * 50.0) - 100.0
    })
    .add(FollowTarget, { target: playerPosition })
}

// Runs the animation loop and execute all systems every frame.

let lastTime = 0.0;
function loop() {
  const currTime = performance.now();
  const deltaTime = currTime - lastTime;
  lastTime = currTime;
  world.execute(deltaTime);
  requestAnimationFrame(loop);
}
lastTime = performance.now();
loop();
```

### JavaScript

```js
import {
  ComponentData,
  TagComponent,
  NumberProp,
  RefProp,
  System,
  World
} from 'ecstra';

/**
 * Components definition.
 */

class Position2D extends ComponentData {}
Position2D.Properties = {
  x: NumberProp(),
  y: NumberProp()
};

class FollowTarget extends ComponentData {}
FollowTarget.Properties = {
  target: RefProp(),
  speed: NumberProp(1.0)
};

class PlayerTag extends TagComponent {}
class ZombieTag extends TagComponent {}

/**
 * Systems definition.
 */

class ZombieFollowSystem extends System {

  execute(delta) {
    this.queries.zombies.execute((entity) => {
      const { speed, target } = entity.read(FollowTarget);
      const position = entity.write(Position2D);
      const deltaX = target.x - position.x;
      const deltaY = target.y - position.y;
      const len = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (len >= 0.00001) {
        position.x += speed * delta * (deltaX / len);
        position.y += speed * delta * (deltaY / len);
      }
    });
  }

}
ZombieFollowSystem.Queries = {
  // Select entities with all three components `ZombieTag`, `FollowTarget`, and
  // `Position2D`.
  zombies: [ZombieTag, FollowTarget, Position2D]
}

const world = new World().register(ZombieFollowSystem);

// Creates a player entity.
const playerEntity = world.create().add(PlayerTag).add(Position2D);
const playerPosition = playerEntity.read();

// Creates 100 zombies at random positions with a `FollowTarget` component that
// will make them follow our player.
for (let i = 0; i < 100; ++i) {
  world.create()
    .add(ZombieTag)
    .add(Position2D, {
      x: Math.floor(Math.random() * 50.0) - 100.0,
      y: Math.floor(Math.random() * 50.0) - 100.0
    })
    .add(FollowTarget, { target: playerPosition })
}

// Runs the animation loop and execute all systems every frame.

let lastTime = 0.0;
function loop() {
  const currTime = performance.now();
  const deltaTime = currTime - lastTime;
  lastTime = currTime;
  world.execute(deltaTime);
  requestAnimationFrame(loop);
}
lastTime = performance.now();
loop();
```

## Running Examples

In order to try the examples, you need to build the library using:

```sh
yarn build # Alternatively, `yarn start` to watch the files
```

You can then start the examples web server using:

```sh
yarn example
```

### TS Examples

TypeScript versions of the examples are available [here](.examples/typescript).
If you only want to see the example running, you can run the JS ones as they
are identicial.

If you want to run the TypeScript examples themselves, please build the examples
first:

```sh
yarn example:build # Alternatively, `yarn example:start` to watch the files
```

And then run the examples web server:

```sh
yarn example
```

## Stable Version

The library is brand new and it's the perfect time for me to taylor it to match as much as possible most of the developer needs.

I want to open discussion about the following topics:
* Deferred creation and removal of components
* Deferred creation and removal of entities
* Command buffers
* Query system improvement
  * New selector (`Modified`? `Removed`?)
* Is a `StateComponent` component needed?

Please feel free to reach out directly in the [Github Issues](https://github.com/DavidPeicho/ecstra/issues) or contact me on [Twitter](https://twitter.com/DavidPeicho) to discuss those topics.

## Benchmarks

Coming soon.

## Contributing

For detailed information about how to contribute, please have a look at the [CONTRIBUTING.md](./CONTRIBUTING.md) guide.
