export class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  mul(other) {
    if (other instanceof Vec2) {
      return new Vec2(this.x * other.x, this.y * other.y);
    }
    return new Vec2(this.x * other, this.y * other);
  }

  div(other) {
    if (other instanceof Vec2) {
      return new Vec2(this.x / other.x, this.y / other.y);
    }
    return new Vec2(this.x / other, this.y / other);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  copy() {
    return new Vec2(this.x, this.y);
  }
}

export class Transform {
  constructor(vec2, scale) {
    this.translate = vec2;
    this.scale = scale;
  }

  copy() {
    return new Transform(this.translate.copy(), this.scale);
  }

  static default() {
    return new Transform(new Vec2(0, 0), 1);
  }

  toStyle() {
    return `translate(${this.translate.x}px, ${this.translate.y}px) scale(${this.scale})`;
  }
}
