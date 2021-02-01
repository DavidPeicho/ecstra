import { ComponentData } from '../../src/component.js';
import { BooleanProp } from '../../src/property.js';

export class FooComponent extends ComponentData {

  public static Name = 'Foo';

  public static Poperties = {
    isFoo: new BooleanProp(true)
  };

  public isFoo!: boolean;

}

export class BarComponent extends ComponentData {

  public static Name = 'Bar';

  public static Poperties = {
    isBar: new BooleanProp(true),
  };

  public isBar!: boolean;

}
