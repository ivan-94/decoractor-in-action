/* eslint-disable prefer-rest-params */
import { ref, unref } from 'vue'

import { initialIfNeed } from './utils'
import type { Initializer } from './utils'

export const observable: PropertyDecorator = function (target, propertyKey) {
  if (typeof target === 'function') {
    throw new Error('Observable cannot be used on static properties')
  }

  if (arguments.length > 2 && arguments[2] != null) {
    throw new Error('Observable cannot be used on methods')
  }

  const accessor: Initializer = (self) => {
    const descriptor = Object.getOwnPropertyDescriptor(self, propertyKey)
    const initialValue = descriptor?.value
    const value = ref(initialValue)

    return {
      get() {
        return unref(value)
      },
      set(val) {
        value.value = val
      }
    }
  }

  // 定义属性
  Object.defineProperty(target, propertyKey, {
    enumerable: true,
    configurable: true,
    get: function () {
      return initialIfNeed(this, propertyKey, accessor).get()
    },
    set: function (value) {
      initialIfNeed(this, propertyKey, accessor).set(value)
    }
  })
}
