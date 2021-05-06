import { Entity } from './entity.js';
import { SequentialPool } from './pool/sequential-pool.js';
import { World } from './world.js';
import { ComponentClass, PropertiesOf } from './types';
import { Component } from './component.js';

enum CommandType {
  None = 0,
  Add = 1,
  Remove = 2,
  AddComponent = 3,
  RemoveComponent = 4
}

class Command {

  public type: CommandType;
  public entity: Entity;
  public data: ComponentClass;

  public constructor() {
    this.type = CommandType.None;
    this.entity = null!;
    this.data = null!;
  }

}

export class CommandBuffer {

  private _pool: SequentialPool<Command>;

  private _executor = (cmd: Command): void => {
    switch (cmd.type) {
      case CommandType.Remove:
        // @todo: batch entity removal in world if possible.
        cmd.entity.destroy();
        break;
      case CommandType.Remove:
        // @todo: batch archetype removal in world if possible.
        cmd.entity.remove(cmd.data);
        break;
    }
  };

  public constructor(world: World) {
    this._pool = new SequentialPool(Command);
  }

  public remove(entity: Entity): void {
    const cmd = this._pool.acquire();
    cmd.type = CommandType.Remove;
    cmd.entity = entity;
  }

  public addComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>,
    opts?: PropertiesOf<T>
  ): void {
    const cmd = this._pool.acquire();
    cmd.type = CommandType.AddComponent;
    cmd.entity = entity;
    // @todo: create API point in World to pre-create a component.
    // This is tricky though because if the command buffer is never called, the
    // component pool will never be freed.
    cmd.data = componentClass;
  }

  public removeComponent(entity: Entity, componentClass: ComponentClass): void {
    const cmd = this._pool.acquire();
    cmd.type = CommandType.RemoveComponent;
    cmd.entity = entity;
    cmd.data = componentClass;
  }

  public playback(): void {
    this._pool.execute(this._executor);
    this._pool.release();
  }

}
