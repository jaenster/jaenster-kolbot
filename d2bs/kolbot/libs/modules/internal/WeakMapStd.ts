/**
 * @description Just a weakmap with a default value as standard
 * @author Jaenster
 */


export default class WeakMapStd<K extends object, V extends any> extends WeakMap<K, V> {

    private factory: () => V;

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