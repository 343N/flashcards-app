// Bi-directional map
export default class BiMap<T, U> {

    private map: Map<T, U>
    private inverseMap: Map<U, T>


    constructor(){
        this.map = new Map<T, U>();
        this.inverseMap = new Map<U, T>();
    }

    set(key: T, value: U): void {
        this.map.set(key, value);
        this.inverseMap.set(value, key);
    }

    // returns the key associated with the given value
    key(value: U): T | undefined {
        return this.inverseMap.get(value);
    }
    
    // returns the value associated with the given key
    value(key: T): U | undefined {
        return this.map.get(key);
    }

    // deletes the pair with the given key
    deleteKey(key: T): void {
        if (!this.map.get(key)) return;
        let val = this.map.get(key)
        this.map.delete(key)
        this.inverseMap.delete(val as U)
    }

    // deletes the pair with the given value
    deleteValue(val: U): void {
        let key = this.inverseMap.get(val)
        this.map.delete(key as T)
        this.inverseMap.delete(val)

    }

}