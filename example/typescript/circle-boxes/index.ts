import {
  World, System, ComponentData, TagComponent, number, string, queries, after
} from '../../../dist/index.js';

const NUM_ELEMENTS = 600;
const SPEED_MULTIPLIER = 0.1;
const SHAPE_SIZE = 20;
const SHAPE_HALF_SIZE = SHAPE_SIZE / 2;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let canvasWidth = canvas.width = window.innerWidth;
let canvasHeight = canvas.height = window.innerHeight;

/**
 * Components
 */

class Velocity extends ComponentData {
  @number()
  x!: number;
  @number()
  y!: number;
}

class Position extends ComponentData {
  @number()
  x!: number;
  @number()
  y!: number;
}

class Shape extends ComponentData {
  @string()
  primitive!: string;
}

class Renderable extends TagComponent {}

/**
 * Systems
 */

@queries({
  // The `moving` query looks for entities with both the `Velocity` and
  // `Position` components.
  moving: [ Velocity, Position ]
})
class MovableSystem extends System {
  public execute(delta) {
    this.queries.moving.execute(entity => {
      const velocity = entity.read(Velocity);
      const position = entity.write(Position);
      position.x += velocity.x * delta;
      position.y += velocity.y * delta;
      if (position.x > canvasWidth + SHAPE_HALF_SIZE) position.x = - SHAPE_HALF_SIZE;
      if (position.x < - SHAPE_HALF_SIZE) position.x = canvasWidth + SHAPE_HALF_SIZE;
      if (position.y > canvasHeight + SHAPE_HALF_SIZE) position.y = - SHAPE_HALF_SIZE;
      if (position.y < - SHAPE_HALF_SIZE) position.y = canvasHeight + SHAPE_HALF_SIZE;
    });
  }
}

@after([MovableSystem])
class RendererSystem extends System {

  // This is equivalent to using the `query` decorator.
  public static Queries = {
    // The `renderables` query looks for entities with both the
    // `Renderable` and `Shape` components.
    renderables: [Renderable, Shape]
  };

  public execute(): void {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    //ctx.globalAlpha = 0.6;

    // Iterate through all the entities on the query
    this.queries.renderables.execute(entity => {
      const shape = entity.read(Shape);
      const position = entity.read(Position);
      if (shape.primitive === 'box') {
        this.drawBox(position);
      } else {
        this.drawCircle(position);
      }
    });
  }

  drawCircle(position) {
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(position.x, position.y, SHAPE_HALF_SIZE, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#222";
    ctx.stroke();
  }

  drawBox(position) {
   ctx.beginPath();
    ctx.rect(position.x - SHAPE_HALF_SIZE, position.y - SHAPE_HALF_SIZE, SHAPE_SIZE, SHAPE_SIZE);
    ctx.fillStyle= "#f28d89";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#800904";
    ctx.stroke();
  }
}

window.addEventListener( 'resize', () => {
  canvasWidth = canvas.width = window.innerWidth
  canvasHeight = canvas.height = window.innerHeight;
}, false );

// Step 1 - Create the world that will host our entities.
const world = new World()
  .register(MovableSystem)
  .register(RendererSystem);

// Step 2 - Create entities with random velocity / positions / shapes
for (let i = 0; i < NUM_ELEMENTS; i++) {
  world
    .create()
    .add(Velocity, getRandomVelocity())
    .add(Shape, getRandomShape())
    .add(Shape, getRandomShape())
    .add(Position, getRandomPosition())
    .add(Renderable)
}

// Step 3 - Run all the systems and let the ECS do its job!
let lastTime = 0;
function run() {
  // Compute delta and elapsed time.
  const time = performance.now();
  const delta = time - lastTime;

  // Runs all the systems.
  world.execute(delta);

  lastTime = time;
  requestAnimationFrame(run);
}
lastTime = performance.now();
run();

/**
 * Set of helpers for component instanciation
 */

function getRandomVelocity(): { x: number, y: number } {
  return {
    x: SPEED_MULTIPLIER * (2 * Math.random() - 1),
    y: SPEED_MULTIPLIER * (2 * Math.random() - 1)
  };
}
function getRandomPosition(): { x: number, y: number } {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight
  };
}
function getRandomShape(): { primitive: string } {
   return {
     primitive: Math.random() >= 0.5 ? 'circle' : 'box'
   };
}
