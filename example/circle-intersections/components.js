/**
 * File taken and adapted from
 * https://github.com/ecsyjs/ecsy/tree/dev/site/examples/canvas
 */

import {
  ArrayProp,
  ComponentData,
  CopyableProp,
  NumberProp,
  RefProp
} from '../../dist/index.js';

export class Vector2 {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(source) {
    this.x = source.x;
    this.y = source.y;
    return this;
  }

  clone() {
    return new Vector2().set(this.x, this.y);
  }
}

export class Movement extends ComponentData {}
Movement.Properties = {
  velocity: CopyableProp({ type: Vector2 }),
  acceleration: CopyableProp({ type: Vector2 })
};

export class Circle extends ComponentData {}
Circle.Properties = {
  position: CopyableProp({ type: Vector2 }),
  radius: NumberProp(),
  velocity: CopyableProp({ type: Vector2 }),
  acceleration: CopyableProp({ type: Vector2 })
};

export class CanvasContext extends ComponentData {}
CanvasContext.Properties = {
  ctx: RefProp(),
  width: NumberProp(),
  height: NumberProp()
};

export class DemoSettings extends ComponentData {}
DemoSettings.Properties = {
  speedMultiplier: NumberProp(0.001)
};

export class Intersecting extends ComponentData {}
Intersecting.Properties = {
  points: ArrayProp()
};
