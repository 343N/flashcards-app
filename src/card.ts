class Card {

    static interval: Array<number>;

    private _id: string = "";
    private _front: string  = "";
    private _back: string = "";
    private _initDate = new Date();
    private _lastCompletion: Date | undefined;
    private _stage: number = 0;
    private _fingerprint: string = "";

    constructor(d: Card){
        if (!d.front && !d.back) return;
        this._front = d.front;
        this._back = d.back;
        this._id = d.id;
        this._initDate = (d.initDate != null) ? new Date(d.initDate) : new Date();
        this._lastCompletion = (d.lastCompletion != null) ? new Date(d.lastCompletion) : undefined;
        this._stage = d.stage || 0
        this.validateData()
        this.generateFingerprint()
    }

    
    set id(id: string)  { this._id = id; }
    get id(): string    { return this._id }

    set front(d: string){ this._front = d; }
    get front(): string { return this._front }

    set back(d: string) { this._back = d; }
    get back():string  { return this._back }

    set initDate(d: Date)   { this._initDate = d; }
    get initDate(): Date    { return this._initDate }

    set lastCompletion(d: Date | undefined)   { this._lastCompletion = d; }
    get lastCompletion(): Date | undefined    { return this._lastCompletion }

    set stage(d: number) { this._stage = d; }
    get stage(): number  { return this._stage }

    set fingerprint(d: string) { this._fingerprint = d; }
    get fingerprint(): string  { return this._fingerprint }

    validateData(){
        this.front = this.front?.trim()
        this.back = this.back?.trim()
    }

    generateFingerprint(){
        this.validateData()
        this.fingerprint = Buffer.from(this.front + this.back).toString('base64')
    }

    isValid(){
        return this.front && this.back
    }
    
    toJSON(){
        return {
            id: this.id,
            front: this.front,
            back: this.back,
            initDate: this.initDate,
            lastCompletion: this.lastCompletion,
            stage: this.stage,
            fingerprint: this.fingerprint
        }
    }
    
    static setCompletionInterval(interval: Array<number>){
        Card.interval = interval
    }
}

Card.interval = [1, 1, 2, 4, 8, 16, 32, 64]


export default Card;