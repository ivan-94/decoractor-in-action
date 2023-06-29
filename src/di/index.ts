// polyfill
declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol
  }

  interface Function {
    [Symbol.metadata]?: DecoratorMetadata
  }
}
// runtime polyfill
if (typeof Symbol.metadata === 'undefined') {
  // @ts-expect-error
  Symbol.metadata = Symbol('Symbol.metadata')
}

export interface InjectionKey<T> extends Symbol {}

const METADATA_KEY: unique symbol = Symbol('METADATA_KEY')

export enum Scope {
  Singleton,
  Transient
}

interface Injection {
  key: InjectionKey<unknown>
  multiple?: boolean
  context: ClassFieldDecoratorContext
}

interface InjectionMetadata {
  injectable?: InjectionKey<unknown>
  scope?: Scope
  injections?: Map<PropertyKey, Injection>
}

function getOrCreateMetadata<T>(metadata: DecoratorMetadata): InjectionMetadata {
  if (metadata == null) {
    throw new Error('Decorator metadata is not defined')
  }

  return metadata[METADATA_KEY] ?? (metadata[METADATA_KEY] = {})
}

function injectToField(injection: Injection) {
  const { context } = injection

  if (context.static === true) {
    throw new Error('inject cannot be used on static fields')
  }

  const metadata = getOrCreateMetadata(context.metadata)

  if (metadata.injections == null) {
    metadata.injections = new Map()
  }

  if (metadata.injections.has(context.name)) {
    throw new Error(`inject is already defined for ${context.name.toString()}`)
  }

  metadata.injections.set(context.name, injection)
}

export function injectable<T, Class extends abstract new (...args: any) => T>(
  key: InjectionKey<T>,
  scope?: Scope
) {
  return (value: Class, context: ClassDecoratorContext<Class>) => {
    const metadata = getOrCreateMetadata(context.metadata)

    if (metadata.injectable) {
      throw new Error('injectable is already defined')
    }

    metadata.injectable = key
    metadata.scope = scope
  }
}

export function inject<T>(key: InjectionKey<T>) {
  return (value: undefined, context: ClassFieldDecoratorContext<unknown, T | undefined>) => {
    injectToField({ key, context })
  }
}

export function injectAll<T>(key: InjectionKey<T>) {
  return (value: undefined, context: ClassFieldDecoratorContext<unknown, T[] | undefined>) => {
    injectToField({ key, multiple: true, context })
  }
}

type Ctor<T = unknown> = new (...args: any) => T

export class Container {
  private bindings: Map<InjectionKey<unknown>, Ctor[]> = new Map()
  private pools: Map<Ctor, unknown> = new Map()

  bind<T>(key: InjectionKey<T>, impl: new (...args: any) => T) {
    if (impl[Symbol.metadata] == null) {
      throw new Error(`No metadata found for ${impl.name}`)
    }

    if (this.bindings.has(key)) {
      this.bindings.get(key)!.push(impl)
    } else {
      this.bindings.set(key, [impl])
    }
  }

  get<T>(key: InjectionKey<T>): T {
    return this.resolve(key, false) as T
  }

  getAll<T>(key: InjectionKey<T>): T[] {
    return this.resolve(key, true) as T[]
  }

  /**
   * 对象查找
   */
  private resolve(key: InjectionKey<unknown>, multiple: boolean): unknown {
    const binding = this.bindings.get(key)

    if (binding == null) {
      throw new Error(`No binding found for ${key.toString()}`)
    }

    if (!multiple && binding.length > 1) {
      throw new Error(`Multiple bindings found for ${key.toString()}`)
    }

    return multiple
      ? binding.map((impl) => this.createInstance(impl))
      : this.createInstance(binding[0])
  }

  /**
   * 对象实例化
   */
  private createInstance(impl: Ctor): unknown {
    if (impl[Symbol.metadata] == null) {
      throw new Error(`No metadata found for ${impl.name}`)
    }
    const metadata = impl[Symbol.metadata]![METADATA_KEY] as InjectionMetadata | undefined

    if (metadata == null || metadata.injectable == null) {
      throw new Error(`No injectable found for ${impl.name}`)
    }

    const { scope = Scope.Singleton, injections } = metadata

    // 单例
    if (scope === Scope.Singleton && this.pools.has(impl)) {
      return this.pools.get(impl)
    }

    // 实例化
    const instance = new impl()
    // 依赖注入
    if (injections != null) {
      for (const injection of injections.values()) {
        const { key, context, multiple } = injection
        const value = multiple ? this.getAll(key) : this.get(key)
        context.access.set(instance, value)
      }
    }

    if (scope === Scope.Singleton) {
      this.pools.set(impl, instance)
    }

    return instance
  }
}
