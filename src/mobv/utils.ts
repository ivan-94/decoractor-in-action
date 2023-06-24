const REACTIVE_CACHE = Symbol('reactive_cache')

/**
 * 查看属性是否定义
 * @param target
 * @param key
 * @returns
 */
export function hasProp(target: Object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(target, key)
}

/**
 * 添加不能枚举的字段
 * @param target
 * @param key
 */
export function addHiddenProp(target: Object, key: PropertyKey, value: any) {
  Object.defineProperty(target, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value
  })
}

function getReactiveCache(target: any): Record<string | symbol, any> {
  if (!hasProp(target, REACTIVE_CACHE)) {
    addHiddenProp(target, REACTIVE_CACHE, {})
  }

  return target[REACTIVE_CACHE]
}

export interface ReactiveAccessor {
  get(): any
  set(value: any): void
}

export type Initializer = (target: any) => ReactiveAccessor

export function initialIfNeed(target: any, key: string | symbol, initializer: Initializer) {
  const cache = getReactiveCache(target)

  if (!hasProp(cache, key)) {
    cache[key] = initializer(target)
  }

  return cache[key]
}
