export interface InjectionKey<T> extends Symbol {}

declare function injectable<T, Class extends abstract new (...args: any) => T>(
  key: InjectionKey<T>
): (value: Class, context: ClassDecoratorContext<Class>) => void

declare function inject<T>(
  key: InjectionKey<T>
): (value: undefined, context: ClassFieldDecoratorContext<unknown, T | undefined>) => void

declare function injectAll<T>(
  key: InjectionKey<T>
): (value: undefined, context: ClassFieldDecoratorContext<unknown, T[] | undefined>) => void

interface Bird {
  fly(): void
  searchForFood(): void
  breed(): void
}

const BIRD_BINDING: InjectionKey<Bird> = Symbol('Bird')

// @ts-expect-error ❌ 没有履行 Bird 协议
@injectable(BIRD_BINDING)
class Eagle {}

// ✅ 履行了 Bird 协议
@injectable(BIRD_BINDING)
class Pigeon implements Bird {
  fly() {}
  searchForFood() {}
  breed() {}
}

class Zoo {
  // @ts-expect-error ❌ 类型不匹配
  @inject(BIRD_BINDING)
  private unknown?: number

  // ✅
  @inject(BIRD_BINDING)
  private bird?: Bird

  // @ts-expect-error ❌ 类型不匹配
  @injectAll(BIRD_BINDING)
  private allBirds?: Bird

  // ✅
  @injectAll(BIRD_BINDING)
  private birds?: Bird[]
}
