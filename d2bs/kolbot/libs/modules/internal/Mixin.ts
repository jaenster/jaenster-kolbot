export type Class<Instance = {}> = new (...args: any[]) => Instance;

export function mixin(target: Class<any>,...arg: Class<any>[]) {
    arg.forEach(({prototype}) => {
        Object.getOwnPropertyNames(prototype)
            .filter(key => key !== 'constructor') // skip out constructor
            .forEach(key => target.prototype[key] = target.prototype[key] ?? prototype[key]);
    })
}
