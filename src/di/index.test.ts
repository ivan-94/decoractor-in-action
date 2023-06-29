import { describe, expect, test } from '@jest/globals'
import { Container, injectable, Scope, type InjectionKey, injectAll } from '.'

interface Bird {
  fly(): void
  searchForFood(): void
  breed(): void
}

const BIRD_BINDING: InjectionKey<Bird> = Symbol('Bird')

describe('di', () => {
  test('throw error if metadata is not defined', () => {
    const container = new Container()
    class MyBird {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    expect(() => container.bind(BIRD_BINDING, MyBird)).toThrowError('No metadata found for MyBird')
  })

  test('singleton', () => {
    @injectable(BIRD_BINDING)
    class MyBird {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    const container = new Container()
    container.bind(BIRD_BINDING, MyBird)

    const bird1 = container.get(BIRD_BINDING)
    expect(bird1).toBeInstanceOf(MyBird)

    const bird2 = container.get(BIRD_BINDING)
    expect(bird2).toBeInstanceOf(MyBird)
    expect(bird1).toBe(bird2)
  })

  test('singleton multiple', () => {
    @injectable(BIRD_BINDING)
    class MyBird {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    @injectable(BIRD_BINDING)
    class MyBird2 {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    const container = new Container()
    container.bind(BIRD_BINDING, MyBird)
    container.bind(BIRD_BINDING, MyBird2)

    const birds1 = container.getAll(BIRD_BINDING)
    expect(birds1.length).toBe(2)
    expect(birds1[0]).toBeInstanceOf(MyBird)
    expect(birds1[1]).toBeInstanceOf(MyBird2)

    const birds2 = container.getAll(BIRD_BINDING)
    expect(birds1[0]).toBe(birds2[0])
    expect(birds1[1]).toBe(birds2[1])
  })

  test('transiten', () => {
    @injectable(BIRD_BINDING, Scope.Transient)
    class MyBird {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    const container = new Container()
    container.bind(BIRD_BINDING, MyBird)

    const bird1 = container.get(BIRD_BINDING)
    expect(bird1).toBeInstanceOf(MyBird)

    const bird2 = container.get(BIRD_BINDING)
    expect(bird2).toBeInstanceOf(MyBird)
    expect(bird1).not.toBe(bird2)
  })

  test('property inject', () => {
    @injectable(BIRD_BINDING)
    class MyBird {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    @injectable(BIRD_BINDING)
    class MyBird2 {
      fly() {}
      searchForFood() {}
      breed() {}
    }

    interface IZoo {
      getAllBirds(): Bird[]
    }

    const ZOO_KEY: InjectionKey<IZoo> = Symbol('Zoo')

    @injectable(ZOO_KEY)
    class Zoo implements IZoo {
      @injectAll(BIRD_BINDING)
      birds?: Bird[]

      getAllBirds() {
        return this.birds!
      }
    }

    const container = new Container()
    container.bind(BIRD_BINDING, MyBird)
    container.bind(BIRD_BINDING, MyBird2)
    container.bind(ZOO_KEY, Zoo)

    const zoo = container.get(ZOO_KEY)

    expect(zoo).toBeInstanceOf(Zoo)
		expect(zoo.getAllBirds().length).toBe(2)
  })
})
