import { Entity } from './entity.js';
import { SequentialPool } from './pool/sequential-pool.js';
import { ComponentClass, Nullable, Option, PropertiesOf } from './types';
import { Component } from './component.js';

enum CommandType {
  None = 0,
  Remove = 2,
  AddComponent = 3,
  RemoveComponent = 4
}

class Command {
  public type: CommandType;
  public entity: Entity;
  public componentClass: Nullable<ComponentClass>;
  public componentOptions: Option<PropertiesOf<Component>>;

  public constructor() {
    this.type = CommandType.None;
    this.entity = null!;
    this.componentClass = null;
    this.componentOptions = undefined;
  }

  public init(entity: Entity): Command {
    this.type = CommandType.None;
    this.entity = entity;
    this.componentClass = null;
    this.componentOptions = undefined;
    return this;
  }
}

/**
 * A command buffer is used to save operations to apply on entities, such as
 * destruction / creation of entity, or addition / removal of component.
 *
 * The user registes command into the command buffer, and later applies the
 * saved commands using the `playback()` method.
 *
 * Command buffers are useful to defer modification applies to the world and
 * its entities. In a multithreaded environment, they would also allow to
 * better synchronization read & write operations applied to the world
 *
 * @category entity
 */
export class CommandBuffer {
  /** @hidden */
  private _pool: SequentialPool<Command>;

  /** @hidden */
  private _executor = (cmd: Command): void => {
    // @todo: batch entity removal in world if possible.
    // Right now, adding / removing multiple components will be slow!
    switch (cmd.type) {
      case CommandType.Remove:
        cmd.entity.destroy();
        break;
      case CommandType.AddComponent:
        // @todo: batch archetype removal in world if possible.
        cmd.entity.add(
          cmd.componentClass as ComponentClass,
          cmd.componentOptions
        );
        break;
      case CommandType.RemoveComponent:
        // @todo: batch archetype removal in world if possible.
        cmd.entity.remove(cmd.componentClass as ComponentClass);
        break;
    }
  };

  public constructor() {
    this._pool = new SequentialPool(Command);
  }

  /**
   * Registers a command to remove a given entity.
   *
   * On playback, the target entity will be removed
   *
   * @param entity - Entity to later remove
   */
  public remove(entity: Entity): void {
    const cmd = this._pool.acquire().init(entity);
    cmd.type = CommandType.Remove;
  }

  /**
   * Registers a command to add a component to a given entity.
   *
   * On playback, the given component will be added to the target entity
   *
   * @param entity - Entity to later remove
   * @param componentClass - The class of the component to add
   */
  public addComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): void {
    const cmd = this._pool.acquire().init(entity);
    cmd.type = CommandType.AddComponent;

    // @todo: create API point in World to pre-create a component.
    // This is tricky though because if the command buffer is never called, the
    // component pool will never be freed.
    cmd.componentClass = componentClass;
    cmd.componentOptions = opts;
  }

  /**
   * Registers a command to remove a component from a given entity.
   *
   * On playback, the given component will be removed from the target entity
   *
   * @param entity - Entity to later remove
   * @param componentClass - The class of the component to add
   */
  public removeComponent(entity: Entity, componentClass: ComponentClass): void {
    const cmd = this._pool.acquire().init(entity);
    cmd.type = CommandType.RemoveComponent;
    cmd.componentClass = componentClass;
  }

  /**
   * Applies the list of registered commands to the world
   */
  public playback(): void {
    this._pool.execute(this._executor);
    this._pool.release();
  }
}
