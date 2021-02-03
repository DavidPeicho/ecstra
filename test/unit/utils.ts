import { ComponentData } from '../../src/component.js';
import { BooleanProp, NumberProp, StringProp } from '../../src/property.js';
import { System } from '../../src/system.js';

export class FooComponent extends ComponentData {
  public static Name = 'Foo';

  public static Properties = {
    isFoo: BooleanProp(true),
    count: NumberProp(1),
    dummy: StringProp('dummy')
  };

  public isFoo!: boolean;
  public count!: number;
  public dummy!: string;
}

export class BarComponent extends ComponentData {
  public static Name = 'Bar';

  public static Properties = {
    isBar: BooleanProp(true)
  };

  public isBar!: boolean;
}

export class FooBarSystem extends System {
  public static Queries = {
    foobar: [FooComponent, BarComponent]
  };
  execute() {}
}
