import { describe, test, expect } from 'vitest'
import { observable } from './observable'
import { watchSyncEffect } from 'vue'

describe('observable', () => {
  test('static property', () => {
    expect(() => {
      class A {
        @observable
        static a = 1
      }
    }).toThrow('Observable cannot be used on static properties')
  })

  test('on method', () => {
    expect(() => {
      class A {
        @observable
        a() {}
      }
    }).toThrow('Observable cannot be used on methods')
  })

  test('base type', () => {
    class A {
      @observable
      str = 'str'

      @observable
      num = 1

      @observable
      withoutInitialValue: any
    }

    const a = new A()

    let str
    let num
    let withoutInitialValue
    expect(a.str).toBe('str')
    expect(a.num).toBe(1)
    expect(a.withoutInitialValue).toBe(undefined)

    watchSyncEffect(() => {
      str = a.str
    })
    watchSyncEffect(() => {
      num = a.num
    })
    watchSyncEffect(() => {
      withoutInitialValue = a.withoutInitialValue
    })

    a.str = 'new str'
    a.num = 2
    a.withoutInitialValue = 'withoutInitialValue'

    expect(str).toBe('new str')
    expect(num).toBe(2)
    expect(withoutInitialValue).toBe('withoutInitialValue')
  })

  test('reactive object', () => {
    class A {
      @observable
      obj = {
        count: 1
      }
    }

    const a = new A()

    let count
    watchSyncEffect(() => {
      count = a.obj.count
    })

    expect(count).toBe(1)
    a.obj.count = 2
    expect(count).toBe(2)

    // extends

    class B extends A {
      @observable
      obj = {
        count: 3
      }
    }

    const b = new B()
    expect(b.obj.count).toBe(3)
  })
})
