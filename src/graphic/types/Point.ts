import { isZero } from '../algorithm/math';
/**
 * The base type of graphic ,(location & vector)
 */
export default class Point implements IPoint {
  /**
   * static method to create instance from params
   */
  static instantiate(x, y) {
    if (typeof x === 'undefined') throw TypeError('Invalid arguments!');
    if (typeof x === 'number') {
      return typeof y === 'number' ? new Point(x, y) : new Point(x, x);
    }
    // if x is Point
    return x.clone();
  }

  x = 0;
  y = 0;
  /**
   * Create Point with x, y
   *
   * @param {Number} x
   * @param {Number} y
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 返回是否小于极小值
   */
  isZero(): boolean {
    return isZero(this.x) && isZero(this.y);
  }

  /**
   * Returns the addition of the supplied value to both coordinates of
   * the point as a new point.
   * The object itself is not modified!
   */
  add(x: number | IPoint, y?: number): IPoint {
    let point = Point.instantiate(x, y);
    return new Point(this.x + point.x, this.y + point.y);
  }

  /**
   * Returns the multiplication of the supplied point to the point as a new
   * point.
   * The object itself is not modified!
   */
  multiply(x: number | IPoint, y?: number): IPoint {
    let point = Point.instantiate(x, y);
    return new Point(this.x * point.x, this.y * point.y);
  }

  /**
   * Returns the subtraction of the supplied value to both coordinates of
   * the point as a new point.
   * The object itself is not modified!
   */
  subtract(x: number | IPoint, y: number): IPoint {
    let point = Point.instantiate(x, y);
    return new Point(this.x - point.x, this.y - point.y);
  }

  /**
   * Returns the division of the supplied value to both coordinates of
   * the point as a new point.
   * The object itself is not modified!
   */
  divide(x: number, y: number): IPoint {
    let point = Point.instantiate(x, y);
    return new Point(this.x / point.x, this.y / point.y);
  }

  /**
   * Transforms the point by the matrix as a new point. The object itself is
   * not modified!
   *
   * @param {Matrix} matrix
   */
  transform(matrix): IPoint {
    matrix.applyToPoint(this);
    return this;
  }

  /**
   * Add and return this
   * @param {Point} other
   */
  addEquals(other: IPoint): IPoint {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
   * Assign x, y from other point.
   * @param {*} point
   */
  assign(point: IPoint): IPoint {
    this.x = point.x;
    this.y = point.y;
    return this;
  }

  /**
   * If the point coord is equal to the other point.
   * @param {Point} other
   */
  equals(other: IPoint): boolean {
    return this === other || (this.x === other.x && this.y === other.y);
  }

  /**
   * Returns new point which is the result of linear interpolation with this one and another one
   * @param {Point} other
   * @param {Number} time , position of interpolation, between 0 and 1 default 0.5
   * @return {Point}
   */
  lerp(other: IPoint, time = 0.5): IPoint {
    if (time > 1 || time < 0) throw new TypeError(`Param 'Time' must between 0 and 1;`);
    time = Math.max(Math.min(1, time), 0);
    return new Point(this.x + (other.x - this.x) * time, this.y + (other.y - this.y) * time);
  }

  /**
   * Returns the point between this point and another one
   * @param {Point} other
   * @return {Point}
   */
  midPointFrom(other: IPoint): IPoint {
    return this.lerp(other);
  }

  /**
   * Returns distance from other point.
   * @param {point} other
   */
  getDistance(other: IPoint): number {
    const dx = this.x - other.x,
      dy = this.y - other.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   *
   * @param {Point} point
   * @param {number} threshold
   */
  nearby(point: IPoint, threshold = 4): boolean {
    return this.getDistance(point) < threshold;
  }

  /**
   * negate point & return a new point.
   */
  negate(): IPoint {
    return new Point(-this.x, -this.y);
  }

  /**
   * get the length of point from (0,0);
   */
  get length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get Angle In Radians, Vector
   */
  get angle(): number {
    if (!this.length) return 0;
    return Math.atan2(this.y, this.x);
  }

  /**
   * Rotates the point by the given angle around an optional center point.
   * The object itself is not modified.
   *
   * Read more about angle units and orientation in the description of the
   * {@link #angle} property.
   *
   * @param {Number} angle the rotation angle
   * @param {Point} center the center point of the rotation
   * @return {Point} the rotated point
   */
  rotate(angle: number, center?: IPoint): IPoint {
    if (angle === 0) return this.clone();
    angle = (angle * Math.PI) / 180;

    let point = center ? this.subtract(center.x, center.y) : this,
      sin = Math.sin(angle),
      cos = Math.cos(angle);

    point = new Point(point.x * cos - point.y * sin, point.x * sin + point.y * cos);

    return center ? point.add(center, 0) : point;
  }

  /**
   * Normalize modifies the {@link #length} of the vector to `1` without
   * changing its angle and returns it as a new point. The optional `length`
   * parameter defines the length to normalize to. The object itself is not
   * modified!
   *
   * @param {Number} [length=1] The length of the normalized vector
   * @return {Point} the normalized vector of the vector that is represented
   *     by this point's coordinates
   */
  normalize(length = 1): IPoint {
    let current = this.length,
      scale = current !== 0 ? length / current : 0;

    return new Point(this.x * scale, this.y * scale);
  }

  /**
   * {@group-title Vector Math Functions}
   * Returns the dot product of the point and another point.
   *
   * @param {Point} point
   * @return {Number} the dot product of the two points
   */
  dot(point: IPoint): number {
    return this.x * point.x + this.y * point.y;
  }

  /**
   * return a cloned instance of the point
   * @return {Point}
   */
  clone(): IPoint {
    return new Point(this.x, this.y);
  }

  /**
   * return point data as JSON-format: [x, y]
   */
  toJSON(precision = -1): number[] {
    if (precision === -1) return [this.x, this.y];

    let multiplier = Math.pow(10, precision);
    return [Math.round(this.x * multiplier) / multiplier, Math.round(this.y * multiplier) / multiplier];
  }

  /**
   * return point data as String-format
   */
  toString(): string {
    return '{ x: ' + this.x + ', y: ' + this.y + ' }';
  }
}