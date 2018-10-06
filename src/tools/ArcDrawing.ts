import Tool from './Tool.js';
import Point from '../graphic/types/Point.js';
import { CustomizeMouseEvent } from '../Whiteboard/EventType.js';

export default class ArcDrawing extends Tool {
  
  public center!: Point | null;
  public radius!: number;

  constructor(type) {
    super(type);
    this.center = null;
  }

  onMouseDown(event: CustomizeMouseEvent) {
    if (this.center) {
      this.radius = event.point.subtract(this.center).length;
    } else this.center = event.point;
  }

  onMouseMove(_event) {}
  onMouseDrag(_event) {}
  onMouseUp(_event) {}
}
