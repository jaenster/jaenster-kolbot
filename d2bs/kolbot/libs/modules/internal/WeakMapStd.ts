/**
 * @description Just a weakmap with a default value as standard
 * @author Jaenster
 */


export class WeakMapStd<K extends object, V extends any> extends WeakMap<K, V> {

    private readonly factory: () => V;

    constructor(factory: () => V) {
        super();
        this.factory = factory;
    }

    get(key: K): V {
        let returnData = super.get(key);
        if (returnData === undefined) super.set(key, returnData = this.factory());
        return returnData;
    }

}

export class MapStd<K, V> extends Map<K, V> {

    private readonly factory: () => V;

    constructor(factory: () => V) {
        super();
        this.factory = factory;
    }

    get(key: K): V {
        let returnData = super.get(key);
        if (returnData === undefined) super.set(key, returnData = this.factory());
        return returnData;
    }

}