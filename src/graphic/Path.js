
import { LineSegment, BezierSegment, MoveSegment, QuadraticSegment, ArcSegment } from './types/Segment';
import Point from './types/Point';
import Rect from './types/Rect';
import fitCurve from './algorithm/fitCurve';
import smoothCurve from './algorithm/smoothCurve';
import { memoized, changed} from '../decorators/memoized'
import Item from './Item';

const _segments = Symbol('_segments');

/**
 * A full path and base class of all single path shapes.
 * 所有矢量图形的父类
 */
class Path extends Item {

  _fill = true;

  /**
   * 用与从JSON构造出Path实例
   * @param {*} segments
   */
  static instantiate(preset, segments) {
    let instance = new Path(preset);

    segments.forEach(seg => {
      let segment;
      if (seg.length == 1) {
        segment = new MoveSegment(new Point(seg[0][0], seg[0][1]));
      } else if (seg.length == 4) {
        segment = new BezierSegment(
          new Point(seg[1][0], seg[1][1]),
          new Point(seg[2][0], seg[2][1]),
          new Point(seg[3][0], seg[3][1])
        );
      }
      instance.add(segment)
    });

    return instance;
  }
  constructor(preset) {
    super(preset);
    if(preset)
      this.style.strokeStyle.alpha = preset.alpha || 1;
  }

  [_segments] = [];
  startPoint = null;
  contextPoint = null;
  isClose = false;
  showAuxiliary = false;


  get segments() {
    return this[_segments];
  }

  get fill(){
    return this._fill;
  }

  @changed()
  set fill(val){
    if(typeof val!== 'boolean') throw new TypeError("ensure boolean!");

    this._fill = val;
    return this;
  }

  add(segment) {
    segment.owner = this;
    segment.contextPoint = this.contextPoint;
    this.segments.push(segment);
    this.contextPoint = segment.point;
    this.markAsDirty();
  }

  *[Symbol.iterator]() {
    for (let i = 0, len = this.segments.length; i < len; i++) {
      yield this.segments[i];
    }
  }

  clear() {
    this[_segments] = [];
  }

  arc(x, y, r, sa, ea) {
    let segment = new ArcSegment();
    segment.arc = [x, y, r, sa, ea];
    this.add(segment);
    return this;
    // segment
  }

  arcTo(cp1, cp2, radius) {
    let segment = new ArcSegment(cp1, cp2, radius);
    this.add(segment);
    return this;
    // segment
  }

  moveTo(point) {
    let segment = new MoveSegment(point);
    this.add(segment);
    return this;
  }

  lineTo(point) {
    let segment = new LineSegment(point);
    this.add(segment);
    return this;
  }

  /**
   * Support chaining-call
   * @param {*} cp1
   * @param {*} cp2
   * @param {*} point
   */
  bezierCurveTo(cp1, cp2, point) {
    let segment = new BezierSegment(cp1, cp2, point);
    this.add(segment);
    return this;
  }

  quadraticCurveTo(cp, point) { //二阶转三阶

    let current = this.contextPoint;

    // This is exact:
    // If we have the three quad points: A E D,
    // and the cubic is A B C D,
    // B = E + 1/3 (A - E)
    // C = E + 1/3 (D - E)
    this.bezierCurveTo(
      cp.add(current.subtract(cp).multiply(1 / 3)),
      cp.add(point.subtract(cp).multiply(1 / 3)),
      point
    );
    return this;
  }

  quadraticCurveTo2(cp, point) {
    let segment = new QuadraticSegment(cp, point);
    this.add(segment);
    return this;
  }

  closePath() {
    this.isClose = true;
  }

  /**
   * get bounds of path. It's a memoized getter for performance.
   */
  @memoized()
  get bounds() {
    let x1 = Infinity,
      x2 = -x1,
      y1 = x1,
      y2 = x2;

    for (let i = 0, l = this.segments.length; i < l; i++) {
      let bound = this.segments[i].bounds;

      let xn = bound.x,
        yn = bound.y,
        xx = bound.x + bound.width,
        yx = bound.y + bound.height;

      if (xn < x1) x1 = xn;
      if (xx > x2) x2 = xx;
      if (yn < y1) y1 = yn;
      if (yx > y2) y2 = yx;
    }

    return new Rect(x1, y1, x2 - x1, y2 - y1, this);

  }

  get strokeBounds() {
    return this.bounds.expand(this.style.lineWidth / 2);
  }

  simplify() {
    //不优化小于3个点的曲线
    if(this.segments.length < 3) return this;

    let segments = fitCurve(this.segments.map(item => item.point), 1);
    this[_segments] = ([this[_segments][0]]).concat(segments);
    this.markAsDirty();
    return this;
  }

  smooth() {
    let segment = smoothCurve(this.segments, this.isClose);
    this[_segments] = segment;
    return this;
  }

  /**
   * If point in path.
   * @param {Point} point
   */
  containsPoint(point) {
    // If point not in bounds of path, return false.
    if (!super.containsPoint(point)) return false;

    let seg = this.segments.find(item => item.containsPoint(point, this.style.lineWidth));
    return !!seg;
  }

  transformContent(matrix) {
    this.segments.forEach(item => {
      item.transformCoordinates(matrix);
    });
    this.matrix.reset();
  }

  _draw(ctx) {

    ctx.beginPath();

    for (let i = 0, segment, len = this.segments.length; i < len; ++i) {

      segment = this.segments[i];

      switch (segment.command) { // first letter
        case 'm':
        case 'M': // moveTo, absolute
          ctx.moveTo(segment.point.x, segment.point.y);
          break;
        case 'a':
        case 'A':
          // ctx.arc.apply(ctx, [...segment.arc]);
          ctx.arcTo.apply(ctx, segment.args);
          break;
        case 'l':
        case 'L': // lineto, absolute
          ctx.lineTo.apply(ctx, segment.args);
          break;
        case 'q':
        case 'Q':
          ctx.quadraticCurveTo.apply(ctx, segment.args);
          break;
        case 'c':
        case 'C':
          ctx.bezierCurveTo.apply(ctx, segment.args);
          break;
      }
    }

    if (this.isClose) ctx.closePath();

    this.fill ? ctx.fill() :  ctx.stroke();

    if (this.showAuxiliary)
      this.segments.forEach(segment => segment.draw(ctx));
  }

  _toJSON() {
    return this.segments.map(item => item.toJSON());
  }

  toString() {
    let segmentSVG = this.segments.map(item => item.toString()).join(' ');
    return `<path d="${segmentSVG} ${this.isClose ? 'z' : ''}"></path>`;
  }
}

export default Path;
