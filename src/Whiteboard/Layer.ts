import { setStyle } from '../util/dom';
import ItemCollection from './ItemCollection';
import Matrix from '../graphic/types/Matrix';
import Rect from '../graphic/types/Rect';
import Whiteboard from '.';

/**
 * Create canvas layer, and Manage all canvases in whiteboard.
 */
export default class Layer {
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  globalCtx: any;
  role: string;
  el: HTMLCanvasElement;
  _bounds: Rect | null = null;
  wrapper: HTMLElement | null = null;

  private _items = new ItemCollection(this);

  _isDirty = true;
  matrix = new Matrix();
  offscreen = false;

  /**
   * Move items from one to other
   * @param {Layer} source layer
   * @param {Layer} target layer
   * @param {Function | undefined} fn callback.
   */
  static elevator(source: Layer, target: Layer, fn?) {
    let sourceItems = source.items;

    for (let i = 0, len = sourceItems.length; i < len; i++) {
      let element = sourceItems.get(0);
      source.items.remove(element);
      target.items.add(element);
    }
    fn && fn();
  }

  /**
   * Get bounds of layer.
   */
  get bounds() {
    return this._bounds;
  }

  /**
   * Alias of items.append .
   * @param {Item} item
   */
  append(item) {
    this.items.add(item);
  }

  /**
   * Alias of items.remove .
   * @param {Item} item
   */
  remove(item) {
    this.items.remove(item);
  }

  /**
   * Create whiteboard layer with specified width & height.
   *
   * @param {Number} width
   * @param {Number} height
   * @param {String} role
   */
  constructor(width, height, role: string = '') {
    let el = document.createElement('canvas');
    el.setAttribute('data-role', role);
    el.setAttribute('canvas-id', role);
    this.role = role;
    this.el = el;

    // if (typeof wx !== 'undefined' && wx.createCanvasContext) {
    //   // adapt to wechat-mini-app
    //   this.ctx = wx.createCanvasContext(role);
    // } else {
    //   this.ctx = el.getContext('2d') as CanvasRenderingContext2D;
    // }
    this.ctx = el.getContext('2d') as CanvasRenderingContext2D;

    this.width = width;
    this.height = height;
    this._bounds = new Rect(0, 0, this.width, this.height);

    setStyle(el, {
      position: 'absolute',
      width: `${this.width}px`,
      height: `${this.height}px`,
      left: 0,
      top: 0,
      'touch-action': 'none',
    });

    if (this.deviceRatio > 1) {
      this.applyRatio();
    }
  }

  _draw() {
    this.globalCtx.refreshCount++;
    this._items.filter(item => !item.input).forEach(item => item && item.draw(this.ctx));
  }

  /**
   * refresh current layer.
   */
  refresh() {
    this._clearCanvas();
    this.globalCtx.emit('layer:refresh', { layer: this });
    this._draw();
    this._isDirty = false;
  }

  get items() {
    return this._items;
  }

  get deviceRatio() {
    return window.devicePixelRatio || 1;
  }

  get pixelRadio() {
    let ctx = this.ctx;
    let canvas = document.createElement('canvas');
    if (!/^off|false$/.test(canvas.getAttribute('hidpi') || '')) {
      let backingStoreRatio =
        ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio ||
        1;

      return this.deviceRatio / backingStoreRatio;
    }
    return this.deviceRatio;
  }

  /**
   * prop 'isDirty' is readonly
   */
  get isDirty() {
    return this._isDirty;
  }

  /**
   * Mark layer as 'dirty', it will be refreshed on next tick.
   */
  markAsDirty() {
    this._isDirty = true;
  }

  /**
   * Apply deviceRatio to Canvas, for retina.
   */
  applyRatio() {
    this.el.width = this.width * this.deviceRatio;
    this.el.height = this.height * this.deviceRatio;
    this.ctx.scale(this.deviceRatio, this.deviceRatio);
  }

  /**
   * reset transform for initial state.
   */
  resetTransform() {
    this.ctx.setTransform(this.deviceRatio, 0, 0, this.deviceRatio, 0, 0);
  }

  _clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * clear current layer.
   */
  clear() {
    this.items.clear();
  }

  /**
   * 等比缩放画布
   * @param {Number} radio
   */
  zoom(radio) {
    // /this.ctx.scale(radio, radio);
    this.matrix.scale(radio, radio);
    setStyle(this.el, {
      width: `${this.width * radio}px`,
      height: `${this.height * radio}px`,
    });

    this.el.width = this.el.width * radio;
    this.el.height = this.el.height * radio;
    this.markAsDirty();
  }

  appendTo(whiteboard: Whiteboard) {
    //appendTo wrapper.
    if (this.offscreen) return;

    this.wrapper = whiteboard.wrapper;
    this.wrapper.appendChild(this.el);

    //ref whiteboard context.
    this.globalCtx = whiteboard.context;
  }

  /**
   *
   */
  elevateTo(target) {
    Layer.elevator(this, target);
  }

  /**
   * 释放该Layer
   */
  dispose() {
    this.wrapper && this.wrapper.removeChild(this.el);
  }
}