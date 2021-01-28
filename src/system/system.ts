import { Component } from '../component';
import { Constructor, SystemClass } from '../types';
import { SystemGroup } from './system-group';

export abstract class System {
  public static readonly queries?: StaticQueries;
  public static readonly group?: Constructor<SystemGroup>;
  public static readonly updateAfter?: SystemClass[];
  public static readonly updateBefore?: SystemClass[];

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

export function sortByOrder(a: Orderable, b: Orderable): number {
  return a.order - b.order;
}

export interface SystemOptions {
  group: SystemGroup;
  params: any;
}

export type StaticQueries = {
  [key: string]: Component[];
};

export type Orderable = { order: number };
