import * as Misc from './Misc'
import {MapStd, WeakMapStd} from "./internal/WeakMapStd";

type handler<T> = (this: T, ...args) => void;
type handlerObj<T> = MapStd<PropertyKey, Set<handler<T>>>;


const ON = 1,
    ONCE = 1


const onList = [void 0, void 0].map(() => new WeakMapStd<Eventable, handlerObj<Eventable>>(() => new MapStd(() => new Set)));

export default abstract class Eventable {
    private onHandler<T extends Eventable>(this: T, event: PropertyKey, handler: (this: T, ...args) => void, list = onList[0]): T {

        list.get(this) // generate object, or fetch existing data
            .get(event) // generate or get event type
            .add(handler); // add event handler on object

        return this;
    }

    on<T extends Eventable>(this: T, event: PropertyKey, handler: (this: T, ...args) => void): T {
        return this.onHandler(event, handler, onList[ON]);
    }

    once<T extends Eventable>(this: T, event: PropertyKey, handler: (this: T, ...args) => void): T {
        return this.onHandler(event, handler, onList[ONCE]);
    }

    off<T extends Eventable>(this: T, event: PropertyKey, handler: (this: T, ...args) => void): T {
        for (let i = onList.length - 1; i-- > 0;) {
            onList[i].get(this)
        }
        return this;
    }

    emit<T extends Eventable>(this: T, event: PropertyKey, ...args): T {
        const all = new Set(), adder = all.add.bind(all);

        const onceEvents = onList[ONCE].get(this).get(event);
        onceEvents.forEach(adder);
        onceEvents.clear();

        onList[ON].get(this).get(event).forEach(adder);

        all.forEach((fn) => {
            try {
                fn(...args);
            } catch (e) {
                Misc.errorReport(e);
            }
        })


        return this;
    }
}