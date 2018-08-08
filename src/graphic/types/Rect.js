import Point from './Point';

const horizontal = ['left', 'centerX', 'right']; //CenterX
const vertical = ['top', 'centerY', 'bottom']; //CenterY
const define = Object.defineProperty;


/**
 * 首字幕大写
 * @param { } str
 */
const capitalize = (str) => {
  return str.replace(/\b[a-z]/g, function(match) {
      return match.toUpperCase();
  });
}

/**
 * 获取属性名
 * @param {*} y
 * @param {*} x
 * @param {*} indexY
 * @param {*} indexX
 */
const getKey = (y, x, indexY, indexX) => {
  if(indexY === 1) {
    if(indexX === 1) return 'center';
    return x + 'Center';
  }
  if(indexX === 1) return y + 'Center';
  return y + capitalize(x);
}

/**
 * Cross product
 * @param {Array} a1
 * @param {Array} a2
 * @param {Function} itor
 */
const cross = (a1, a2, itor) => {
  a1.forEach((i1, i1Idx) => {
    a2.forEach((i2, i2Idx) => {
      itor.apply(null, [i1, i2, i1Idx, i2Idx]);
    });
  });
}

/**
 *  Type Rect
 */
class Rect {

  /**
   * static method to create instance from params
   */
  static instantiate(x, y, width, height) {
    if(typeof x === "number") return new Rect(x, y, width, height)
    return x;
  }

  constructor(x, y, width, height, owner = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.owner = owner;

    cross(horizontal, vertical, (x, y, indexX, indexY)=>
      define(this, getKey(y, x, indexY, indexX), {
        get(){
          return new Point(this[x], this[y]);
        },
        set(point){
          this[x] = point.x;
          this[y] = point.y;
          // A special setter where we allow chaining, because it comes in handy
          // in a couple of places in core.
          return this;
        },
        enumerable: true,
        configurable: true,
      })
    );
  }

  /**
   * Assign x, y, width, height from other rect.
   * @param {Rect} rect
   */
  assign(rect) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
  }

  /** The coordinate of the top, left, right, bottom. */

  /**
   * The coordinate of the top.
   *
   * @type Number
   *
   */
  get top() { return this.y; }
  set top(top) { this.y = top;}

  /**
   * The coordinate of the left.
   *
   * @type Number
   *
   */
  get left() { return this.x; }
  set left(left) { this.x = left; }

  /**
   * The coordinate of bottom, getter && setter
   *
   * @type Number
   *
   */
  get bottom() { return this.y + this.height; }
  set bottom(bottom) {  this.y = bottom - this.height; }

  /**
   * The coordinate of right, getter && setter
   *
   * @type Number
   */
  get right() { return this.x + this.width; }
  set right(right) { this.x  = right - this.width; }


  /**
   * The center-x coordinate of the rectangle.
   *
   * @type Number
   */
  get centerX() {
    return this.x + this.width / 2;
  }

  set centerX(val){
    this.x = val - this.width / 2;
  }

  /**
   * The center-y coordinate of the rectangle.
   *
   * @type Number
   */
  get centerY() {
    return this.y + this.height / 2;
  }

  set centerY(val){
    this.y = val - this.height / 2;
  }

  //alias for
  setCenter(x, y) {
    let point = Point.instantiate(point);
    this.center = point;
    return this;
  }


  /**
   * The area of the rectangle.
   *
   * @bean
   * @type Number
   */
  get area() {
    return this.width * this.height;
  }


  /**
   * Returns a new rectangle representing the union of this rectangle with the
   * specified rectangle.
   *
   * @param {Rect} rect the rectangle to be combined with this rectangle
   * @return {Rect} the smallest rectangle containing both the specified
   * rectangle and this rectangle
   */
  unite(rect) {
    let x1 = Math.min(this.x, rect.x),
      y1 = Math.min(this.y, rect.y),
      x2 = Math.max(this.x + this.width, rect.x + rect.width),
      y2 = Math.max(this.y + this.height, rect.y + rect.height);

    return new Rect(x1, y1, x2 - x1, y2 - y1);
  }

  /**
   * Detect rectangles either by checking for 'width' on the passed object
   * or by looking at the amount of elements in the arguments list,
   * or the passed array:
   */
  contains(arg) {
    return arg && arg.width !== undefined
      || (Array.isArray(arg) ? arg : arguments).length === 4
      ? this.containsRectangle(Rect.instantiate(arguments))
      : this.containsPoint(Point.instantiate(arguments));
  }

  /**
   *  Tests if the specified point is inside the boundary of the rectangle.
   *
   * @function
   * @param {Point} point the specified point
   * @type Boolean
   * @ignore
   */
  containsPoint(point) {
    var x = point.x,
      y = point.y;
    return x >= this.x && y >= this.y
      && x <= this.x + this.width
      && y <= this.y + this.height;
  }

  /**
   *   Tests if the interior of the rectangle entirely contains the specified
   *
   * @function
   * @param {Rect} point the specified rectangle
   * @type Boolean
   * @ignore
   */
  containsRectangle(rect) {
    var x = rect.x,
      y = rect.y;
    return x >= this.x && y >= this.y
      && x + rect.width <= this.x + this.width
      && y + rect.height <= this.y + this.height;
  }

  /**
   * Returns a copy of the rectangle.
   *
   * @function
   * @type Point
   */
  clone() {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  /**
   * Expend width, height. as same keep center
   * @param {Number} width
   * @param {Number} height
   */
  expand(width, height) {
    if (typeof height === 'undefined') height = width;

    return new Rect(this.x - width / 2, this.y - height / 2,
      this.width + width, this.height + height);
  }

  /**
   * return point data as JSON-format: [x, y, width, height]
   */
  toJSON(){
    return [this.x , this.y, this.width, this.height];
  }

  /**
   * return string format.
   */
  toString() {
    return '{ x: ' + this.x
      + ', y: ' + this.y
      + ', width: ' + this.width
      + ', height: ' + this.height
      + ' }';
  }
}

export default Rect;