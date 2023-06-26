/* eslint-disable prefer-rest-params */
import { Ref, effectScope, unref, computed as vueComputed } from 'vue'

const COMPUTED_CACHE: unique symbol = Symbol('computed_cache')

export function computed<This, Return, Value extends () => Return>(
  value: Value,
  context: ClassGetterDecoratorContext<This, Return>
): Value | void {
  if (context.static) {
    throw new Error('computed cannot be used on static member')
  }

  if (context.kind !== 'getter') {
    throw new Error('computed can only be used on getter')
  }

  context.addInitializer(function (this: unknown) {
    if (!Object.prototype.hasOwnProperty.call(this, COMPUTED_CACHE)) {
      Object.defineProperty(this, COMPUTED_CACHE, {
        configurable: true,
        enumerable: false,
        value: new Map()
      })
    }
  })

  return function (this: Object) {
    const cache = this[COMPUTED_CACHE] as Map<string | symbol, Ref<Return>>
    if (!cache.has(context.name)) {
      // 异步初始化
      const scope = effectScope(true)

      const val = scope.run(() => vueComputed(() => value.call(this)))!

      cache.set(context.name, val)
    }

    return unref(cache.get(context.name))
  } as Value
}
