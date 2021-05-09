export {
  Component,
  ComponentData,
  TagComponent,
  SingletonComponent
} from './component.js';
export { Entity } from './entity.js';
export { Query, Not } from './query.js';
export { System } from './system.js';
export { SystemGroup } from './system-group.js';
export { World } from './world.js';

export { ComponentRegisterOptions } from './internals/component-manager';

/** Misc */

export { DefaultPool, ObjectPool } from './pool/pool.js';

/** Properties. */

export * from './property.js';

/** Decorators. */

// @todo: maybe it shouldn't be exported by default?
export * from './decorators.js';

/** Types. */
export * from './types.js';
