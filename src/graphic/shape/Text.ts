import Item from '../Item';
import Rect from '../types/Rect';
import Point from '../types/Point';

const replaceAll = (target: string, search: string, replacement: string): string => target.replace(new RegExp(search, 'g'), replacement);

const getStylePropertyValue = (target, property) => {
  const style = window.getComputedStyle(target, null);
  return parseInt(style.getPropertyValue(property), 10);
};

export const drawTextImg = (element: HTMLDivElement, ctx: CanvasRenderingContext2D) => {
  const preStyle = element.getAttribute('style');
  if (!preStyle) return;
  const width = getStylePropertyValue(element, 'width');
  const height = getStylePropertyValue(element, 'height');
  const left = getStylePropertyValue(element, 'left');
  const top = getStylePropertyValue(element, 'top');
  const style = preStyle.replace(/(.+)(position.+?;)(.+)/, (_1, $2, _2, $4) => $2 + $4); // svg 中加入position 会导致 转 img 失败
  let content = element.innerHTML;
  content = replaceAll(content, '&nbsp;', ' ');
  content = replaceAll(content, '<br>', '<br></br>');
  const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="${style}">${content}</div></foreignObject></svg>`;

  const DOM_URL = window.URL || window.webkitURL || window;
  const img = new Image();
  const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = DOM_URL.createObjectURL(svg);

  img.onload = () => {
    ctx.drawImage(img, left, top);
    DOM_URL.revokeObjectURL(url);
  };
  // document.body.appendChild(img);
  img.src = url;
};

/**
 * Text Item;
 */
export default class Text extends Item {
  // private _mode = 'textarea'; // textarea
  // private _autoBreak = true; // if _autoBreak is true, Text line will break if out of canvas bounds.
  private _editable = false;
  // private _crossBorder = false; // can cross a boundary
  private _cxt!: CanvasRenderingContext2D;
  
  public startPoint!: Point;
  public endPoint!: Point;
  public value!: string;
  public input!: HTMLDivElement;

  /**
   * 每点击一次创建一个可编辑框
   */
  protected _draw(cxt: CanvasRenderingContext2D) {
    this._cxt = cxt;
    const { x, y } = this.startPoint;
    this.input = document.createElement('div');
    this.input.setAttribute('contenteditable', this._editable.toString());
    this.input.setAttribute('style', '');
    this.input.setAttribute('autocapitalize', 'off');
    this.input.setAttribute('autocorrect', 'off');
    this.input.setAttribute('autocomplete', 'off');

    Object.assign(this.input.style, {
      fontFamily: this.style.font || 'sans-serif',
      'min-width': '100px',
      'font-weight': 400,
      color: this.style.strokeColor,
      // 'font-style': this.style.italic ? 'italic' : 'normal',
      'font-size': `${this.style.fontSize}px`,
      position: 'absolute',
      left: `${x}px`,
      top: `${y - 10}px`,
    });
    const panelWrapper = document.getElementById('draw-panel');
    if (!panelWrapper) {
      throw ("can not find div about draw-panel");
    }
    panelWrapper.appendChild(this.input);
    this.bindInputEvent();
    this.input.focus();
  }

  set editable(val: boolean) {
    this._editable = val;
    if (this.input) {
      this.input.setAttribute('contenteditable', val.toString());
    }
  }

  bindInputEvent() {
    if (!this.input) return;
    this.input.addEventListener('input', event => {
      if (!event.target) return;
      this.value = event.target.innerHTML;
      // this.lines = this.value.split(/\r?\n/);
    });
  }

  /**
   * @param offset object {x, y}
   */
  updatePosition({ x = 0, y = 0 }) {
    const { left, top } = this.input.style;
    if (!left || !top) return;
    Object.assign(this.input.style, {
      left: `${Number(left) - x}px`,
      top: `${Number(top) - y}px`,
    });
  }

  protected _drawTextImg() {
    drawTextImg(this.input, this._cxt);
  }

  protected _toJSON(): any {
  }

  /**
   * just for ts lint, no sense
   */
  public get bounds(): Rect { return new Rect(0, 0, 0, 0) }
}
