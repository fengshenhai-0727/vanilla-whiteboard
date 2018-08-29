const cachedPropsKey = '__cachedProps';

/**
 * mark getter as memoized prop, the value is cached till the instance mark as dirty,
 * @param {String} cacheKey, Specify the cacheKey of prop (default value: PropName)
 */
export function memoized(cacheKey) {

  return function (target, name, descriptor) {

    if (typeof descriptor.get !== 'function')
      throw new Error(`Can't decorate ${name}, Only used for getter~`);

    cacheKey = cacheKey || `${name}`;
    const { get } = descriptor;

    descriptor.get = function () {
      let cacheProps = this[cachedPropsKey];
      if (typeof cacheProps[cacheKey] !== 'undefined')
        return cacheProps[cacheKey];
      return cacheProps[cacheKey] = get.apply(this);
    }

    return descriptor;
  }
}

/**
 * mark setter. if the value changed, it will trigger canvas refresh OR mark layer as dirty.
 */
export function changed() {
  return function (target, name, descriptor) {
    if (typeof descriptor.set !== 'function')
      throw new Error(`Can't decorate ${name}, Only used for setter~`);

    const { set } = descriptor;
    descriptor.set = function () {
      this.changed();
      return set.apply(this, arguments);
    }

    return descriptor;
  }
}

/**
 * Mark class as memoizable, It will inject prop 'cachedProps' and 'changed' method in  prototype:
 *
 * cachedProps: will cache the complex compute prop. And it will be cleared the changed invoked.
 * changed: Notify the layer to refresh.
 *
 */
export function memoizable() {

  return function (target) {

    if (typeof target.prototype.changed === 'function')
      throw new Error(`can't decorate memoizable twice!`);

    // _cachedProps list.
    target.prototype[cachedPropsKey] = {};

    /**
     * mark the item instance as 'dirty', it will trigger canvas refresh and re-calc the memozied props.
     */
    target.prototype.changed = function () {
      if (this.layer) {
        this.layer.markAsDirty();
      }
      this[cachedPropsKey] = {}; //TODO: 策略清缓存
    }

    return target;
  }
}

const validateFunc = function validateFunc(type, key) {
  if (type === Boolean) {
    return function (val) {
      if (typeof val !== 'boolean')
        throw new TypeError(`setter '${key}' accept boolean value!`);
    }
  } else if (type === String) {
    return function (val) {
      if (typeof val !== 'string')
        throw new TypeError(`setter '${key}' accept string value!`);
    }
  } else if (type === Number) {
    return function (val) {
      if (typeof val !== 'number')
        throw new TypeError(`setter '${key}' accept number value!`);
    }
  } else {
    return function (val) {
      if (!val instanceof type)
        throw new TypeError(`setter '${key}' accept ${type.name} value!`);
    }
  }
}

/**
 * Inject observe props for class.
 *
 * @param {Object} desc
 *
 * Code Example:
 *  {
 *    selected: {
 *      type: Boolean,
 *      default: true,
 *      fn: function(newVal) {
 *        console.log(this)
 *      }
 *    }
 *  }
 */
export function observeProps(desc) {
  if (!Object.keys(desc).length)
    throw new TypeError('must pass props!');

  return function (target) {
    for (let key in desc) {
      if (typeof target.prototype[key] !== 'undefined')
        throw new Error(`Prop ${key} already exist!`);

      let propDesc = desc[key];
      //let privateKey = Symbol(`_${key}`);
      let privateKey = `__${key}`;

      target.prototype[privateKey] = propDesc.default;

      let checkParam = validateFunc(propDesc.type, key);
      let fn = propDesc.fn;

      Object.defineProperty(target.prototype, key, {
        get() {
          return this[privateKey];
        },
        set(val) {
          checkParam(val);
          //if not changed, do nothing.
          if (val === this[privateKey]) return;

          this[privateKey] = val;
          fn && fn.call(this, val);
          this.changed();
        },
        enumerable: true,
        configurable: true,
      });
    }
  }
}
