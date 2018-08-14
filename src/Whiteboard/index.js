/**
 *
 */

import emitter from '../decorators/emitter';
import Layer from './Layer';
import { setStyle } from '../util/dom';
import handler from '../event/event';
import Writing from '../graphic/shape/Writing';
import Text from '../graphic/shape/Text';
import saveImage from '../util/saveImage';
import Image from '../graphic/shape/Image';
import Rect from '../graphic/shape/Rect';
import Point from '../graphic/types/Point';
import { getTool } from '../tools';

const _createContext = Symbol('_createContext');
const defaultOptions = {
  selectionMode: "bounds",
  alignToGrid: false,
  refreshMode: 'loop',
  readonly: false,
  width: 1000,
  height: 800,
  showGrid: false,
  showAxes: false,
};

/**
 *
 * Options:
 *
 *  - selectionMode: 'bounds', 'path'
 *  - alignToGrid: boolean 对齐到网格
 *  - loop / notify
 *  - readonly
 *  -
 */
@emitter()
export default class Whiteboard {
  static instances = [];

  backgroundLayer = null;
  activeLayer = null;
  operateLayer = null;

  constructor(options = {}) {
    this.options = Object.assign({}, defaultOptions, options);

    let { container, width, height } = this.options;

    /** 一个container不能加载两个白板*/
    Whiteboard.instances.find(instance => {
      if (instance.wrapper === container)
        throw new Error("Can't instance at same container twice!");
    })

    setStyle(container, {
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative'
    });

    this.wrapper = container;
    this.width = width;
    this.height = height;
    this.context = this[_createContext]();

    this.operateLayer.el.tabIndex = 1; //make container focusable.

    this.backgroundLayer.appendTo(this);
    this.activeLayer.appendTo(this);
    this.operateLayer.appendTo(this);

    handler.context = this.context;
    handler.bind(this.operateLayer);

    Whiteboard.instances.push(this)
  }

  /**
   * 白板实例的context, 每个白板唯一
   * context 可以被layers, item-collection, tools访问
   * 注意，要区分白板实例的context，和canvas getContext
   *
   */
  [_createContext]() {

    let backgroundLayer = new Layer(this.width, this.height, 'background'),
      activeLayer = new Layer(this.width, this.height, 'active'),
      operateLayer = new Layer(this.width, this.height, 'operate');

    let whiteboardCtx = {
      items: activeLayer.items,
      backgroundLayer,
      activeLayer,
      operateLayer,
      currentMode: null,
      settings: this.options,
      emit: this.emit.bind(this)
    }

    // 将context 属性赋值白板实例
    Object.keys(whiteboardCtx).forEach(key => this[key] = whiteboardCtx[key]);

    //return context;
    return whiteboardCtx;
  }

  /**
   * Watch mode. Redraw layer if it mark as dirty in every tick.
   *
   */
  watch() {
    if (this._isLoop === true) throw new Error("Can't watch twice!");

    const drawDirtyLayer = () => {
      if (this.activeLayer.isDirty) this.activeLayer.refresh();
      requestAnimationFrame(drawDirtyLayer);
    }

    //invoke immediately！
    drawDirtyLayer();
    this._isLoop = true;
  }

  /**
   * refresh activeLayer in next tick.
   * Ensure redraw only once in every tick.
   */
  refresh() {
    requestAnimationFrame(() => this.activeLayer.refresh());
  }

  /**
   * refresh all layers in next tick.
   * Ensure redraw only once in every tick.
   */
  refreshAll() {
    requestAnimationFrame(() => this.layers.forEach(layer => layer.refresh()));
  }


  /**
   * get data of items in all layers.
   */
  get data() {
    return this.items.map(item => item.toJSON());
  }

  zoom() { }

  add(segments) {
    let instance = Writing.instantiate(segments);
    this.items.add(instance);
    this.emit('item:add', { instance });
  }

  addText(text) {
    this.items.add(new Text(text));
  }

  addPath(instance) {
    this.items.add(instance);
  }

  addRect(x1, y1, x2, y2) {
    let instance = new Rect(new Point(x1, y1), new Point(x2, y2));
    instance.buildPath();
    this.items.add(instance);
  }

  addImage(src) {
    this.items.add(new Image(src));
  }

  get layers() {
    return [
      this.backgroundLayer,
      this.activeLayer,
      this.operateLayer
    ];
  }

  saveImage() {
    //创建离屏canvas，绘制三个layer；
    let offscreenCanvas = new Layer(this.width, this.height);
    let ctx = offscreenCanvas.ctx;

    this.layers.forEach(layer => ctx.drawImage(layer.el, 0, 0, this.width, this.height));
    return saveImage(offscreenCanvas.el);
  }

  _currentTool = null;

  set tool(val) {
    this._currentTool = getTool(val);
  }

  get tool() {
    return this._currentTool;
  }

  dispose() {
    let wrapper = this.wrapper;
    //TODO: remove all canvas DOM.
    wrapper.removeChild(this.backgroundLayer);
    wrapper.removeChild(this.activeLayer);
  }

  clear() {
    this.items.clear();
    this.activeLayer.clear();
    return this;
  }
}

