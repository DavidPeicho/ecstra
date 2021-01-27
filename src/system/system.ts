import { Component } from '../component';
import { Constructor } from '../types';
import { SystemGroup } from './system-group';

export abstract class System {

  public static readonly queries?: StaticQueries;
  public static readonly group?: Constructor<SystemGroup>;

  public order: number;
  public topologicalOrder: number;

  private _group: SystemGroup;

  public constructor(options: SystemOptions) {
    this.order = 0;
    this.topologicalOrder = 0;
    this._group = options.group;
  }

  public abstract tick(delta: number): void;

}

export interface SystemOptions {
  group: SystemGroup;
  params: any;
}

export type StaticQueries = {
  [ key: string ]: Component[];
};
