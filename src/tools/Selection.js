
import Rect from '../graphic/shape/Rect';
import Point from '../graphic/types/Point';

const cursorMap = {
  'topLeft': 'nw-resize',
  'topCenter': 'n-resize',
  'topRight': 'ne-resize',
  'rightCenter': 'e-resize',
  'bottomRight': 'se-resize',
  'bottomCenter': 's-resize',
  'bottomLeft': 'sw-resize',
  'leftCenter': 'w-resize',
};

const boundsPoi = [
  'topLeft',
  'topCenter',
  'topRight',
  'rightCenter',
  'bottomRight',
  'bottomCenter',
  'bottomLeft',
  'leftCenter',
];

const antiDir = {
  'bottomRight': 'topLeft',
  'topLeft': 'bottomRight',
  'bottomLeft': 'topRight',
  'topRight': 'bottomLeft',
  'rightCenter': 'leftCenter',
  'leftCenter': 'rightCenter',
  'bottomCenter': 'topCenter',
  'topCenter': 'bottomCenter',
};

let realTimeSize, lastSelected = [];

export default class Selection {

  mode = 'move'; //resize, rotate, mutate, select

  constructor(whiteboardCtx) {
    this.layer = whiteboardCtx.operateLayer;
    this.items = whiteboardCtx.items;
    this.ctx = this.layer.ctx;

    this.selectionRect = new Rect();
    this.selectionRect.style.strokeStyle = '#ccc';
    this.selectionRect.style.lineWidth = 1;
    this.selectionRect.style.dashArray = [5, 2];
  }

  setCursor = (value) => {
    this.layer.el.style.cursor = value;
  }

  onMouseDown(event) {
    let point = event.point;

    if(this.pointOnElement(point)) {
      return this.target.selected = true;
    }

    if(!(this.pointOnPoint(point) || this.pointOnResize(point))) {
      this.mode = 'select';
      this.selectionRect.startPoint = point;
    }
  }

  drawControlRect(ctx, bounds) {
    const POINT_WIDTH = 4;
    const OFFSET = POINT_WIDTH / 2;

    ctx.fillStyle = "#009dec";
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#96cef6';
    ctx.beginPath();

    let lastPoint = bounds[boundsPoi[boundsPoi.length -2]], point;
    ctx.moveTo(lastPoint.x, lastPoint.y);
    boundsPoi.forEach(key => {
      point = bounds[key];
      ctx.lineTo(point.x, point.y);
      ctx.fillRect(point.x - OFFSET, point.y - OFFSET, POINT_WIDTH, POINT_WIDTH);
      lastPoint = point;
    })
    let tc = bounds['topCenter'];
    ctx.moveTo(tc.x, tc.y);
    point = tc.add(new Point(0, -50));
    ctx.lineTo(point.x, point.y);
    ctx.fillRect(point.x - OFFSET, point.y - OFFSET, POINT_WIDTH, POINT_WIDTH);

    ctx.stroke();
  }

  onMouseUp(event) {
    this.layer.clear();
    this.mode = 'move';
  }

  onMouseDrag(event) {
    let point = event.point;
    if (this.mode === 'mutate') {
      this.targetPoint.assign(point);
    } if (this.mode === 'select') {
      this._drawSelectArea(this.ctx, point);

      let selected = this.items.filter(
        item => item.selected = this.selectionRect.bounds.containsRectangle(item.bounds)
      );

      if(!selected.length) return;

      if (selected.diff(lastSelected)) {

        lastSelected = selected;
        selected.forEach(item => {
          if (this.selectedBounds) {
            this.selectedBounds = this.selectedBounds.unite(item.bounds);
          } else {
            this.selectedBounds = item.bounds;
          }
        });
      }

    } else if (this.mode === 'resize') {

      this.corner = this.corner.add(event.delta);
      let size = this.corner.subtract(this.basePoint);

      let sx = 1.0,
        sy = 1.0;

      if (Math.abs(realTimeSize.x) > 0.0000001 && this.resizeDir !== 'topCenter' && this.resizeDir !== 'bottomCenter')
        sx = size.x / realTimeSize.x;
      if (Math.abs(realTimeSize.y) > 0.0000001 && this.resizeDir !== 'leftCenter' && this.resizeDir !== 'rightCenter')
        sy = size.y / realTimeSize.y;

      this.target.scale(sx, sy, this.basePoint);
      realTimeSize = size;

    } else if (this.mode === 'move') {
      this.target.translate(event.delta);
    }
  }

  pointOnElement(point) {
    let item;
    if (item = this.items.find(item => item.containsPoint(point))) {
      this.setCursor('pointer');
      this.mode = 'move';
      this.target = item;
      return true;
    }
    return false;
  }

  pointOnPoint(point) {
    let nearbyPoint, seg;
    for (let i = 0; i < this.items.length; i++) {
      let segments = this.items.get(i).segments;

      for (let j = 0; j < segments.length; j++) {
        seg = segments[j];
        if (seg.command !== 'C') continue;
        nearbyPoint = seg.points.find(p => point.nearby(p));
        if (nearbyPoint) break;
      }
      if (nearbyPoint) break;
    }

    if(nearbyPoint) {
      this.mode = 'mutate';
      this.setCursor('pointer');
      this.target = seg.owner;
      this.targetPoint = nearbyPoint;
      return true
    }
    return false;
  }

  pointOnResize(point) {
    let corner, bounds;
    for (let i = 0; i < this.items.length; i++) {
      bounds = this.items.get(i).bounds;
      if (corner = boundsPoi.find(key => point.nearby(bounds[key]))) break;
    }
    if (!corner) {
      this.setCursor('default');
      return false;
    }
    this.mode = 'resize';
    this.setCursor(cursorMap[corner]);

    this.basePoint = bounds[antiDir[corner]];
    this.target = bounds.owner;
    this.corner = bounds[corner];
    this.resizeDir = corner;
    realTimeSize = this.corner.subtract(this.basePoint);
    return true;
  }

  onMouseMove({ point }) {
    if(!(this.pointOnPoint(point) || this.pointOnResize(point)|| this.pointOnElement(point))) {
      this.mode = 'select';
    }
  }

  _drawSelectArea(ctx, point) {
    this.layer.clear();

    this.selectionRect.endPoint = point;
    this.selectionRect.clear();
    this.selectionRect.buildPath();
    this.selectionRect.draw(ctx);


    this.selectedBounds && this.drawControlRect(ctx, this.selectedBounds);
  }

  _multiSelecting(event) {

  }
}
