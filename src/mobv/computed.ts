/* eslint-disable prefer-rest-params */
import { effectScope, unref, computed as vueComputed } from 'vue'

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
    const scope = effectScope(true)

    const val = scope.run(() => vueComputed(() => value.call(this)))

    Object.defineProperty(this, context.name, {
      configurable: true,
      enumerable: false,
      get() {
        return unref(val)
      }
    })
  })
}
