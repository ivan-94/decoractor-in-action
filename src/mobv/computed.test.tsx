import { describe, expect, test } from 'vitest'
import { computed } from './computed'
import { defineComponent, ref, watchSyncEffect, computed as vueComputed, effectScope } from 'vue'
import { observable } from './observable'
import { render } from '@testing-library/vue'
import * as mobx from 'mobx'

describe('computed', () => {
  test('non static', () => {
    expect(() => {
      class A {
        // @ts-expect-error
        @computed
        static a = 1
      }
    }).toThrow('computed cannot be used on static member')
  })

  test('only getter', () => {
    expect(() => {
      class A {
        // @ts-expect-error
        @computed
        a = 1
      }
    }).toThrow('computed can only be used on getter')

    expect(() => {
      class A {
        @computed
        method() {}
      }
    }).toThrow('computed can only be used on getter')

    expect(() => {
      class A {
        @computed
        set setter(val: any) {}
      }
    }).toThrow('computed can only be used on getter')
  })

  test('computed', () => {
    const count = ref(0)
    class A {
      @computed
      get double() {
        return count.value * 2
      }
    }

    const a = new A()
    let value
    watchSyncEffect(() => {
      value = a.double
    })

    expect(value).toBe(0)
    count.value++
    expect(value).toBe(2)
  })

  test('render', () => {
    class A {
      @observable
      count = 1

      @computed
      get double() {
        return this.count * 2
      }
    }

    let count
    const a = new A()

    const Comp = defineComponent({
      setup() {
        watchSyncEffect(() => {
          count = a.double
        })

        return () => {
          return (
            <button>
              {a.double}
              {a.count}
            </button>
          )
        }
      }
    })

    const { unmount } = render(Comp)

    let count2
    watchSyncEffect(() => {
      count2 = a.double
    })

    expect(count).toBe(2)
    expect(count2).toBe(2)

    a.count++
    expect(count).toBe(4)
    expect(count2).toBe(4)

    unmount()

    a.count++
    expect(count).toBe(4)
    // 不再响应
    expect(count2).toBe(6)
  })

  test('memory leak', () => {
    const count = ref(0)
    const scope = effectScope(true)
    const double = scope.run(() => vueComputed(() => count.value * 2))!

    const scope2 = effectScope()
    scope2.run(() => {
      watchSyncEffect(() => {
        console.log(double.value)
      })
    })

    const scope3 = effectScope()
    scope3.run(() => {
      watchSyncEffect(() => {
        console.log(double.value)
      })
    })

    scope2.stop()
    scope3.stop()

    console.log(scope)
  })

  test('memory leak on mobx', () => {
    const count = mobx.observable.box(1)

    const double = mobx.computed(() => count.get() * 2)

    const scope1 = mobx.autorun(
      () => {
        console.log(double.get())
      },
      { name: 'scope' }
    )
    const scope2 = mobx.autorun(
      () => {
        console.log(double.get())
      },
      { name: 'scope' }
    )

    // release
    scope1()
    scope2()

    console.log(scope1)
  })
})
