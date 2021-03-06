/**
 *
 * Make Class support event-emitter:  'on', 'off', 'once' ,'emit'.
 *
 * Code example:
 *
 * declare:
 * @emittable()
 * Class DecoratedClass { change(){ this.emit('changed') } }
 *
 * use:
 * let ins = new DecoratedClass();
 * ins.on('changed', (event)=>{ //dosomething });
 *
 */

export default function emittable(): ClassDecorator {
  return function(target) {
    target.prototype.__callbacks = {};

    /**
     * attach handler for specified event.
     *
     * @param {String} name Name of Event.
     * @param {Function} fn Handler of Event.
     */
    target.prototype.on = function(name: string, fn: () => void) {
      if (typeof name !== 'string' || typeof fn !== 'function') throw new Error('Arguments illegal!');

      this.__callbacks[name] = this.__callbacks[name] || [];
      let handlers = this.__callbacks[name];

      if (handlers.indexOf(fn) === -1) {
        handlers.push(fn);
      }

      return this;
    };

    /**
     * detach handler from specified event. If handler not specified, detach all of handlers.
     *
     * @param {String} name Name of Event.
     * @param {Function} fn Handler of Event.
     */
    target.prototype.off = function(name: string, fn: () => void) {
      if (!this.__callbacks[name]) return this;
      if (typeof fn === 'undefined') {
        delete this.__callbacks[name];
      }
      if (typeof fn !== 'function') throw new Error('second param must be function!');

      let handlers = this.__callbacks[name];
      let index = handlers.indexOf(fn);

      if (index !== -1) {
        handlers.splice(index, 1);
      }

      return this;
    };

    /**
     * Trigger handler once.
     *
     * @param {String} name Name of Event.
     * @param {Function} fn Handler of Event.
     */
    target.prototype.once = function(name: string, fn: () => void) {
      return this.on(name, (...arg: any[]) => {
        fn.apply(this, arg);
        this.off(name, fn);
      });
    };

    /**
     * Trigger handlers of specified event.
     *
     * @param {String} name Name of Event.
     */
    target.prototype.emit = function(name: string, ...args: any[]) {
      let handlers = this.__callbacks[name];
      if (!handlers) return;

      for (let i = 0, len = handlers.length; i < len; i++) {
        let fn = handlers[i];

        if (fn.apply(this, args) === false) {
          if (event && event.stopPropagation) event.stopPropagation();
          break;
        }
      }
    };

    return target;
  };
}

/**
 * Use Event Emitter as instance.
 */
@emittable()
class Emitter {}

export { Emitter };
