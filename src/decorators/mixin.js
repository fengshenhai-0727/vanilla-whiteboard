function assign(target, frm) {
  return Object.assign(target, frm);
};

/**
 * Mixins an object into the classes prototype.
 * @export
 * @param {...Object[]} srcs
 * @returns {ClassDecorator}
 * @example
 *
 * const myMixin = {
 *   blorg: () => 'blorg!'
 * }
 *
 * @Mixin(myMixin)
 * class MyClass {}
 *
 * const myClass = new MyClass();
 *
 * myClass.blorg(); // => 'blorg!'
 */
export function mixin(...srcs) {
  return ((target) => {
    assign(target.prototype, ...srcs);
    return target;
  });
}

/**
 *
 * Mixins property into the classes prototype.
 * @param {Map} props
 */
export function mixinProps(props) { //Object.defineProperty
  return ((target) => {
    for(let key in props) {
      Object.defineProperty(target.prototype, key, props[key]);
    }
    return target;
  });
}

export default mixin;
