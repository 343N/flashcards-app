class Card {



    constructor(data) {
        if (!data) return;
        this.front = data.front;
        this.back = data.back;
        this.id = data.id;
        this.initDate = new Date(data.initDate);
        this.lastCompletion = (data.lastCompletion) ? new Date(data.lastCompletion) : null;
        this.stage = data.stage
    }


    set id(id)  { this._id = id; }
    get id()    { return this._id }

    set front(d){ this._front = d; }
    get front() { return this._front }

    set back(d) { this._back = d; }
    get back()  { return this._back }

    set initDate(d)   { this._initDate = d; }
    get initDate()    { return this._initDate }

    set lastCompletion(d)   { this._lastCompletion = d; }
    get lastCompletion()    { return this._lastCompletion }

    set stage(d) { this._stage = d; }
    get stage()  { return this._stage }

    getDueDateCount(){
        let daysDue = Card.interval[this.stage]
        if (daysDue == null) return -1;

        let d = this.lastCompletion;
        if (!d) return 0;

        let nextDueDate = new Date(d.getTime() + (daysDue * 24 * 60 * 60 * 1000))
        if (nextDueDate < Date.now() || 
            (nextDueDate.toLocaleDateString() == new Date().toLocaleDateString()))
            return 0      
        
        let timebetween = nextDueDate.getTime() - new Date().getTime()
        let daysBetween = timebetween / 1000 / 60 / 60 / 24

        return Math.ceil(daysBetween)

    }

    toJSON() {
        return {
            id: this.id,
            front: this.front,
            back: this.back,
            initDate: this.initDate,
            lastCompletion: this.lastCompletion,
            stage: this.stage
        }
    }

    static setCompletionInterval(interval) {
        Card.interval = interval
    }

    async save(){
        if (this.deleted) return;
        console.log(this)
        let resp = await updateCardAsync(this)
        console.log(resp)
        return [this, resp];
    }

    async delete(){
        this.deleted = true
        let resp = await request('DELETE', `/removeCard`, this.id)
        console.log(resp)
        if (resp.status == 200) {
            removeCardData(this.id)
        } else this.deleted = false
        return [this, resp];
    }





}

Card.interval = [1, 1, 2, 4, 8, 16, 32, 64]

// function 3dTransform(card){
//     document.addEventListener("mousemove")
//     document.addEventListener("touchmove")
// }

