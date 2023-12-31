import { Vector, VectorE } from "../math/Vector.js";
import { AABB } from "./AABB.js";
export class Body {
  constructor(pos, option = {}) {
    this.type = "";
    this.pos = Vector.clone(pos);
    this.force = Vector.zero();
    this.linearVel = Vector.zero();
    this.angle = 0;
    this.angularVel = 0;
    this.density = 1;
    this.mass = 0;
    this.invMass = 0;
    this.restitution = 0.4;
    this.area = 0;
    this.inertia = 0;
    this.invInertia = 0;
    this.isStatic = false;
    this.staticFri = 0.6;
    this.dynamicFri = 0.4;
    this.points = [];
    this._transformedPoints = [];
    this._transformUpdateRequired = false;
    this._aabb = new AABB([0, 0], [0, 0]);
    this._aabbUpdateRequired = false;
    this.aaa = false;
    Object.assign(this, option);
  }
  get transformedPoints() {
    if (this._transformUpdateRequired) {
      this._transformedPoints = this.points.map((point) => Vector.add(Vector.rotate(point, this.angle), this.pos));
      this._transformUpdateRequired = false;
    }
    return this._transformedPoints;
  }
  abc(dt) {
    if (!this.aaa) return;
    const offset = Vector.sub(this.transformedPoints[0], [295, 75]);
    const normal = Vector.normalize(offset);

    const e = this.restitution;

    const ra = Vector.sub([295, 75], this.pos);

    const raPerp = Vector.normal(ra);

    const angularLinearVelA = Vector.scale(raPerp, this.angularVel);

    const relativeVel = Vector.negate(Vector.add(this.linearVel, angularLinearVelA));

    const contactVelocityMag = Vector.dot(relativeVel, normal);

    if (contactVelocityMag > 0) return;
    const raPerpDotN = Vector.dot(raPerp, normal);

    const denom = this.invMass + raPerpDotN * raPerpDotN * this.invInertia;

    const j = (-(1 + e) * contactVelocityMag) / denom;

    const impulse = Vector.scale(normal, j);
    VectorE.sub(this.pos, offset);
    VectorE.sub(this.linearVel, offset);
    VectorE.sub(this.linearVel, Vector.scale(impulse, this.invMass));
    this.angularVel -= Vector.cross(ra, impulse) * this.invInertia;
  }
  update(dt) {
    if (this.isStatic) return;
    this.abc(dt);

    VectorE.add(this.linearVel, Vector.scale(this.force, dt));
    VectorE.add(this.pos, Vector.scale(this.linearVel, dt));
    this.angle += this.angularVel * dt;
    this.force = Vector.zero();
    this._transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  rotate(amount) {
    this.angle += amount;
    this._transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  rotateTo(angle) {
    this.angle = angle;
    this.transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  rotateFrom(amount, center) {
    this.angle += amount;
    const move = Vector.sub(Vector.rotateFrom(this.pos, amount, center), this.pos);
    VectorE.add(this.pos, move);
    this._transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  move(amount) {
    VectorE.add(this.pos, amount);
    this._transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  moveTo(pos) {
    VectorE.set(this.pos, pos);
    this._transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  addForce(amount) {
    this.force = amount;
  }
}

export class BodyBox extends Body {
  constructor(pos, size = [100, 100], option = {}) {
    super(pos, option);
    this.type = "box";
    this.size = Vector.clone(size);
    this.area = size[0] * size[1];
    if (!this.isStatic) {
      this.mass = this.density * this.area;
      this.invMass = 1 / this.mass;
      this.inertia = (1 / 12) * this.mass * (this.size[0] * this.size[0] + this.size[1] * this.size[1]);
      this.invInertia = 1 / this.inertia;
    }
    const halfSize = Vector.scale(this.size, 0.5);
    this.points.push([-halfSize[0], -halfSize[1]]);
    this.points.push([halfSize[0], -halfSize[1]]);
    this.points.push([halfSize[0], halfSize[1]]);
    this.points.push([-halfSize[0], halfSize[1]]);
    this._transformUpdateRequired = true;
    this._aabbUpdateRequired = true;
  }
  get aabb() {
    if (this._aabbUpdateRequired) {
      const min = [Number.MAX_VALUE, Number.MAX_VALUE];
      const max = [Number.MIN_VALUE, Number.MIN_VALUE];
      const transformedPoints = this.transformedPoints;
      transformedPoints.forEach((point) => {
        if (point[0] < min[0]) min[0] = point[0];
        if (point[0] > max[0]) max[0] = point[0];
        if (point[1] < min[1]) min[1] = point[1];
        if (point[1] > max[1]) max[1] = point[1];
      });
      VectorE.set(this._aabb.min, min);
      VectorE.set(this._aabb.max, max);
      this._aabbUpdateRequired = false;
    }
    return this._aabb;
  }
}
export class BodyCircle extends Body {
  constructor(pos, radius = 50, option = {}) {
    super(pos, option);
    this.type = "circle";
    this.radius = radius;
    this.area = this.radius * this.radius * Math.PI;
    if (!this.isStatic) {
      this.mass = this.density * this.area;
      this.invMass = 1 / this.mass;
      this.inertia = (1 / 2) * this.mass * this.radius * this.radius;
      this.invInertia = 1 / this.inertia;
    }
    this._aabbUpdateRequired = true;
  }
  get aabb() {
    if (this._aabbUpdateRequired) {
      this._aabb.min[0] = this.pos[0] - this.radius;
      this._aabb.min[1] = this.pos[1] - this.radius;
      this._aabb.max[0] = this.pos[0] + this.radius;
      this._aabb.max[1] = this.pos[1] + this.radius;
      this._aabbUpdateRequired = false;
    }
    return this._aabb;
  }
  move(amount) {
    VectorE.add(this.pos, amount);
  }
}
