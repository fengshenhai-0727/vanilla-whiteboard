/**
 * Base class of tools
 */
export default class Tool {
  cursor = "pointer";
  _layer = null;

  constructor(){

  }

  set layer(value){
    this._layer = value;
  }

  get layer() {
    return this._layer;
  }
}
