/**
 * File taken and adapted from
 * https://github.com/ecsyjs/ecsy/tree/dev/site/examples/canvas
 */

import { System } from '../../dist/index.js';
import {
  CanvasContext,
  DemoSettings,
  Movement,
  Circle,
  Intersecting,
} from './components.js';

export class MovementSystem extends System {
  execute(delta) {
    const context = this.queries.context.first;
    const canvasWidth = context.read(CanvasContext).width;
    const canvasHeight = context.read(CanvasContext).height;
    const multiplier = context.read(DemoSettings).speedMultiplier;

    this.queries.entities.execute((entity) => {
      const circle = entity.write(Circle);
      const movement = entity.write(Movement);

      circle.position.x +=
        movement.velocity.x * movement.acceleration.x * delta * multiplier;
      circle.position.y +=
        movement.velocity.y * movement.acceleration.y * delta * multiplier;

      if (movement.acceleration.x > 1)
        movement.acceleration.x -= delta * multiplier;
      if (movement.acceleration.y > 1)
        movement.acceleration.y -= delta * multiplier;
      if (movement.acceleration.x < 1) movement.acceleration.x = 1;
      if (movement.acceleration.y < 1) movement.acceleration.y = 1;
      if (circle.position.y + circle.radius < 0)
        circle.position.y = canvasHeight + circle.radius;
      if (circle.position.y - circle.radius > canvasHeight)
        circle.position.y = -circle.radius;
      if (circle.position.x - circle.radius > canvasWidth)
        circle.position.x = 0;
      if (circle.position.x + circle.radius < 0)
        circle.position.x = canvasWidth;
    });
  }
}
MovementSystem.Queries = {
  entities: [Circle, Movement],
  context: [CanvasContext, DemoSettings],
};

export class IntersectionSystem extends System {
  execute() {
    this.queries.entities.execute((entity) => {
      if (entity.has(Intersecting)) {
        entity.write(Intersecting).points.length = 0;
      }
      const circle = entity.read(Circle);

      this.queries.entities.execute((entityB) => {
        if (entity === entityB) {
          return;
        }
        const circleB = entityB.read(Circle);
        const intersect = intersection(circle, circleB);
        if (intersect !== false) {
          if (!entity.has(Intersecting)) {
            entity.add(Intersecting);
          }
          const intersectComponent = entity.write(Intersecting);
          intersectComponent.points.push(intersect);
        }
      })
      if (
        entity.has(Intersecting) &&
        entity.read(Intersecting).points.length === 0
      ) {
        entity.remove(Intersecting);
      }
    });
  }
}
IntersectionSystem.Queries = {
  entities: [Circle]
};

export class Renderer extends System {
  execute() {
    const context = this.queries.context.first;
    const canvasComponent = context.read(CanvasContext);
    const ctx = canvasComponent.ctx;
    const canvasWidth = canvasComponent.width;
    const canvasHeight = canvasComponent.height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    this.queries.circles.execute((entity) => {
      const circle = entity.read(Circle);
      ctx.beginPath();
      ctx.arc(
        circle.position.x,
        circle.position.y,
        circle.radius,
        0,
        2 * Math.PI,
        false
      );
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    });

    this.queries.intersectingCircles.execute((entity) => {
      const intersect = entity.read(Intersecting);
      for (let j = 0; j < intersect.points.length; j++) {
        const points = intersect.points[j];
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff9";
        ctx.fillStyle = "rgba(255, 255,255, 0.2)";
        fillCircle(ctx, points[0], points[1], 8);
        fillCircle(ctx, points[2], points[3], 8);
        ctx.fillStyle = "#fff";
        fillCircle(ctx, points[0], points[1], 3);
        fillCircle(ctx, points[2], points[3], 3);
        drawLine(ctx, points[0], points[1], points[2], points[3]);
      }
    });
  }
}

Renderer.Queries = {
  circles: [Circle],
  intersectingCircles: [Intersecting],
  context: [CanvasContext]
};

/**
 * Helpers
 */

export function random(a, b) {
  return Math.random() * (b - a) + a;
}

export function intersection(circleA, circleB) {
  var a, dx, dy, d, h, rx, ry;
  var x2, y2;

  // dx and dy are the vertical and horizontal distances between the circle centers.
  dx = circleB.position.x - circleA.position.x;
  dy = circleB.position.y - circleA.position.y;

  // Distance between the centers
  d = Math.sqrt(dy * dy + dx * dx);

  // Check for solvability
  if (d > circleA.radius + circleB.radius) {
    // No solution: circles don't intersect
    return false;
  }
  if (d < Math.abs(circleA.radius - circleB.radius)) {
    // No solution: one circle is contained in the other
    return false;
  }

  /* 'point 2' is the point where the line through the circle
   * intersection points crosses the line between the circle
   * centers.
   */

  /* Determine the distance from point 0 to point 2. */
  a =
    (circleA.radius * circleA.radius -
      circleB.radius * circleB.radius +
      d * d) /
    (2.0 * d);

  /* Determine the coordinates of point 2. */
  x2 = circleA.position.x + (dx * a) / d;
  y2 = circleA.position.y + (dy * a) / d;

  /* Determine the distance from point 2 to either of the
   * intersection points.
   */
  h = Math.sqrt(circleA.radius * circleA.radius - a * a);

  /* Now determine the offsets of the intersection points from
   * point 2.
   */
  rx = -dy * (h / d);
  ry = dx * (h / d);

  /* Determine the absolute intersection points. */
  var xi = x2 + rx;
  var xi_prime = x2 - rx;
  var yi = y2 + ry;
  var yi_prime = y2 - ry;

  return [xi, yi, xi_prime, yi_prime];
}

export function fillCircle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fill();

  return this;
}

export function drawLine(ctx, a, b, c, d) {
  ctx.beginPath(), ctx.moveTo(a, b), ctx.lineTo(c, d), ctx.stroke();
}
