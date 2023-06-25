import { describe, expect, test } from '@jest/globals'
import { computed } from './computed'
import { defineComponent, ref, watchSyncEffect, h } from 'vue'
import { observable } from './observable'
import { render } from '@testing-library/vue'

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
        // @ts-expect-error
        @computed
        method() {}
      }
    }).toThrow('computed can only be used on getter')

    expect(() => {
      class A {
        // @ts-expect-error
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
      accessor count = 1

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
          return h('button', [a.double, a.count])
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
})
