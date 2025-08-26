export class Point {
  public readonly x: number;
  public readonly y: number;

  constructor();
  constructor(n: number);
  constructor(x: number, y: number);
  constructor(e: { clientX: number; clientY: number });
  constructor(p: { x: number; y: number });
  constructor(x: number | { x: number; y: number } | { clientX: number; clientY: number } = 0, y: number = typeof x === 'number' ? x : 0) {
    if (typeof x === 'number') {
      this.x = x;
      this.y = y;
    } else if ('clientX' in x) {
      this.x = x.clientX;
      this.y = x.clientY;
    } else {
      this.x = x.x;
      this.y = x.y;
    }
  }

  public add(n: number): Point;
  public add(x: number, y: number): Point;
  public add(p: { x: number; y: number }): Point;
  public add(x: number | { x: number; y: number }, y?: number): Point {
    if (typeof x === 'number') {
      return new Point(this.x + x, this.y + (y !== undefined ? y : x));
    }
    return new Point(this.x + x.x, this.y + x.y);
  }

  public sub(n: number): Point;
  public sub(x: number, y: number): Point;
  public sub(p: { x: number; y: number }): Point;
  public sub(x: number | { x: number; y: number }, y?: number): Point {
    if (typeof x === 'number') {
      return new Point(this.x - x, this.y - (y !== undefined ? y : x));
    }
    return new Point(this.x - x.x, this.y - x.y);
  }

  public div(n: number): Point;
  public div(x: number, y: number): Point;
  public div(p: { x: number; y: number }): Point;
  public div(x: number | { x: number; y: number }, y?: number): Point {
    if (typeof x === 'number') {
      return new Point(this.x / x, this.y / (y !== undefined ? y : x));
    }
    return new Point(this.x / x.x, this.y / x.y);
  }

  public mul(n: number): Point;
  public mul(x: number, y: number): Point;
  public mul(p: { x: number; y: number }): Point;
  public mul(x: number | { x: number; y: number }, y?: number): Point {
    if (typeof x === 'number') {
      return new Point(this.x * x, this.y * (y !== undefined ? y : x));
    }
    return new Point(this.x * x.x, this.y * x.y);
  }
}
