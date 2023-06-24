/* eslint-disable prefer-rest-params */
import { effectScope, unref, computed as vueComputed } from 'vue'

import { initialIfNeed } from './utils'
import type { Initializer } from './utils'

export const computed: MethodDecorator = function (target, propertyKey, descriptor) {
  if (typeof target === 'function') {
    throw new Error('computed cannot be used on static member')
  }

  if (
    descriptor == null ||
    typeof descriptor !== 'object' ||
    typeof descriptor.get !== 'function'
  ) {
    throw new Error('computed can only be used on getter')
  }

  const initialGetter = descriptor.get
  const accessor: Initializer = (self) => {
    const scope = effectScope(true)

    const value = scope.run(() => vueComputed(() => initialGetter.call(self)))

    return {
      get() {
        return unref(value)
      },
      set() {
        // readonly
      }
    }
  }

  descriptor.get = function () {
    return initialIfNeed(this, propertyKey, accessor).get()
  }
}
