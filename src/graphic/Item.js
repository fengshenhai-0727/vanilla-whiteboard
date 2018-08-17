import { tsid } from '../util/id';
import Style from './types/Style';
import Point from './types/Point';
import Matrix from './types/Matrix';
import { memoizable, changed } from '../decorators/memoized';

const _selected = Symbol('_selected');
const _style = Symbol('_style');

// 白板所有元素的父类
@memoizable()
class Item {

  selectable = true;
  [_selected] = false;
  owner = null;

  constructor(preset) {
    if(preset) {
      this.type = preset.type;
      this.typeId = preset.typeId;
      this.id = preset.id || tsid();
    }

    this[_style] = new Style(preset && preset.style);

    this.matrix = new Matrix();
  }

  get selected() {
    return this[_selected];
  }

  @changed()
  set selected(val) {
    this[_selected] = val;
  }
  /**
 * style of current path
 */
  get style() {
    return this[_style];
  }

  @changed()
  set style(value) {
    this[_style] = value;
    //mark-as-dirty
  }

  get bounds() {
    return null;
  }

  get strokeBounds() {
    return this.bounds;
  }

  get position() {
    return this.bounds.center;
  }

  set position(value) {
    this.setPosition(value.x, value.y);
  }

  setPosition(x, y) {
    return this.translate(Point.instantiate(x, y).subtract(this.position));
  }

  /**
   * Translate to point.
   * @param {Point} point
   */
  translate(point) {
    let mx = new Matrix();
    return this.transform(mx.translate(point));
  }

  /**
   * Scale current item.
   * @param {Number} sx horizantal
   * @param {Number | undefined} sy, if it not set, use sx by default.
   * @param {Point} point Base point.
   */
  scale(sx, sy, point = null) {
    if(typeof sx !== 'number')
      throw new TypeError("param 'sx' of scale must be number!");

    let mx = new Matrix();
    if(typeof sy === 'undefined') sy = sx;
    point = point || this.bounds.center;
    return this.transform(mx.scale(sx, sy, point));
  }

  /**
   * Rotate current item.
   * @param {Number} deg, degree of Rotation.
   * @param {Point} point, Base point.
   */
  rotate(deg, point = null) {
    if(typeof deg !== 'number')
      throw new TypeError("param 'deg' of rotate must be number!");

    let mx = new Matrix();
    point = point || this.bounds.center;
    return this.transform(mx.rotate(deg, point));
  }

  transform(matrix) {
    //TODO: transform stroke & bounds.

    if (matrix) {
      this.matrix = this.matrix.multiply(matrix);
    }

    this.transformContent(matrix);

    this.markAsDirty();
    return this;
  }

  /**
   * Transform group & compoundPath & Segment of path;
   * @param {*} matrix
   */
  transformContent(matrix) {
    if (this.children) {
      this.children.forEach(item => item.transform(matrix));
      this.matrix.reset();
    }
  }

  containsPoint(point) {
    return this.bounds.containsPoint(point);
  }

  _draw(ctx) {
    throw new Error("Abstract method must be overwrite!");
  }

  draw(ctx) {
    ctx.save();
    this.style.apply(ctx);
    this.matrix.applyToContext(ctx);
    this._draw(ctx);
    ctx.restore();

    if (this.selected) this.drawBoundRect(ctx);
    return this;
  }

  toJSON(){
    return [
      this.typeId,
      this.id,
      this._toJSON(),
      this.style.toShortJSON()
    ]
  }

  /**
   * remove from owner-collection;
   */
  remove() {
    this.owner && this.owner.delete(this);
  }

  /**
   * 绘制边界矩形
   * @param {*} ctx
   */
  drawBoundRect(ctx) {
    ctx.save();
    ctx.strokeStyle = '#009dec';
    ctx.lineWidth = 1;
    ctx.strokeRect.apply(ctx, this.strokeBounds.toJSON());
    ctx.restore();
  }
}

export default Item;
