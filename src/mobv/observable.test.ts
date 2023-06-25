import { describe, test, expect } from '@jest/globals'
import { observable } from './observable'
import { watchSyncEffect } from 'vue'

describe('observable', () => {
  test('static property', () => {
    expect(() => {
      class A {
        @observable
        static accessor a = 1
      }
    }).toThrow('observable can not be used on static accessor')
  })

  test('on method', () => {
    expect(() => {
      class A {
        // @ts-expect-error
        @observable
        a() {}
      }
    }).toThrow('observable can only be used on accessor')
  })

  test('base type', () => {
    class A {
      @observable
      accessor str = 'str'

      @observable
      accessor num = 1

      @observable
      accessor withoutInitialValue: any
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
      accessor obj = {
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
      accessor obj = {
        count: 3
      }
    }

    const b = new B()
    expect(b.obj.count).toBe(3)
  })
})
