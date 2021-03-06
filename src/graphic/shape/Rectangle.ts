/**
 * Rectangle support radius.
 */
import Shape from '../Shape';
import Point from '../types/Point';
import { observeProps } from '../../decorators/memoized';

@observeProps({
  /**
   * 是否有圆角
   */
  radius: { type: Number, default: 0 },
})
class Rectangle extends Shape {

  public radius = 0;

  protected _buildPath() {
    let { x: sx, y: sy } = this.startPoint;
    let { x: ex, y: ey } = this.endPoint;
    let width = Math.abs(sx - ex);
    let height = Math.abs(sy - ey);
    let radius = this.radius || 0;
    let shortLine = Math.min(width, height);
    if (radius > shortLine / 2) radius = shortLine / 2;
    let isRounded = radius !== 0;

    this.moveTo(new Point(sx + radius, sy)).lineTo(new Point(ex - radius, sy));
    isRounded && this.arcTo(new Point(ex, sy), new Point(ex, sy + radius), radius);

    this.lineTo(new Point(ex, ey - radius));
    isRounded && this.arcTo(new Point(ex, ey), new Point(ex - radius, ey), radius);

    this.lineTo(new Point(sx + radius, ey));
    isRounded && this.arcTo(new Point(sx, ey), new Point(sx, ey - radius), radius);

    this.lineTo(new Point(sx, sy + radius));
    isRounded && this.arcTo(new Point(sx, sy), new Point(sx + radius, sy), radius);

    this.closePath();
  }
}

export default Rectangle;
