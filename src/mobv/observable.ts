/* eslint-disable prefer-rest-params */
import { ref, type Ref } from 'vue'

export function observable<This, Value>(
  value: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> | void {
  if (context.kind !== 'accessor') {
    throw new Error('observable can only be used on accessor')
  }

  if (context.static) {
    throw new Error('observable can not be used on static accessor')
  }

  context.addInitializer(function (this: unknown) {})

  return {
    get() {
      return (value.get.call(this) as Ref<Value>).value
    },
    set(val) {
      const ref = value.get.call(this) as Ref<Value>

      ref.value = val
    },
    // @ts-expect-error 转换了初始值的类型
    init(val) {
      return ref(val)
    }
  }
}
