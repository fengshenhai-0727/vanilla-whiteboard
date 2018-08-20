
import { BezierSegment, MoveSegment } from '../types/Segment';
import Point from '../types/Point';
import Path from '../Path';

/**
 * Marker & highlighter.
 */
export default class Writing extends Path {

  // set alpha of path style.
  //alpha = 1;

  /**
   * 用与从JSON构造出Writing实例
   * @param {*} segments
   */
  static instantiate(options, segments) {
    let instance = new Path(options);

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


  constructor(options) {
    super(options);
    this.style.strokeStyle.alpha = this.alpha || 1;
  }
}