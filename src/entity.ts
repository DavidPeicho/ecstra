export class Entity {

  public readonly id!: string;

  public constructor(id: string) {
    Object.defineProperty(this, 'id', { value: id });
  }

}
