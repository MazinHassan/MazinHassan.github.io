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

	distance(other) {
		return this.sub(other).length();
	}

	min() {
		return Math.min(this.x, this.y);
	}

	copy() {
		return new Vec2(this.x, this.y);
	}

	static zero() {
		return new Vec2(0, 0);
	}

	static fromClient(obj) {
		return new Vec2(obj.clientX, obj.clientY);
	}
}

export class Rect {
	constructor(x, y, w, h) {
		this.position = new Vec2(x, y);
		this.size = new Vec2(w, h);
	}

	center() {
		return this.position.add(this.size.div(2));
	}

	static fromDomRect(rect) {
		return new Rect(rect.left, rect.top, rect.width, rect.height);
	}
}

export class Transform {
	constructor(vec2, scale) {
		this.translate = vec2;
		this.scale = scale;
	}

	reset() {
		this.translate.x = 0;
		this.translate.y = 0;
		this.scale = 1;
	}

	copy() {
		return new Transform(this.translate.copy(), this.scale);
	}

	toStyle() {
		return `translate(${this.translate.x}px, ${this.translate.y}px) scale(${this.scale})`;
	}

	static default() {
		return new Transform(Vec2.zero(), 1);
	}
}
