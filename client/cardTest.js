class CardTestHandler {

    static RESULT = {
        CORRECT: 0,
        INCORRECT: 1,
        EXIT: 2,
        ERROR: 3
    }

    constructor(array=null, force=null) {
        this.cards = []
        if (array) this.addCards(array, force);
    }

    
    static cardIsDue(card){
        return card.getDueDateCount() == 0
    }

    addCards(cards, force=false){
        if (force) 
            for (let card of cards) 
                this.cards.push(card)
        else  
            for (let card of cards)
                if (CardTestHandler.cardIsDue(card))
                    this.cards.push(card)
            
    }

    addCard(card) {
        this.cards.push(card);
    }

    getCards() {
        return this.cards;
    }

    async testNextCard(){
        const card = this.cards.shift();
        const exp = new ExpandedCard(card, CardDom.get(card.id))
        exp.create(false, true)
        const result = await exp.test(card);
        const removeCover = this.cards.length == 0;
        if (result == CardTestHandler.RESULT.CORRECT) {
            card.stage = card.stage;
            // card.lastCompletion = new Date();
            exp.close(true, {remove_cover: removeCover})
            await new Promise((res, rej) => exp.addEventListener('preDestroy', res))
        }
        else if (result == CardTestHandler.RESULT.INCORRECT) {
            card.stage = 0;
            // card.lastCompletion = new Date();
            exp.close(true, {remove_cover: removeCover})
            await new Promise((res, rej) => exp.addEventListener('preDestroy', res))
        }
        
        else if (result == CardTestHandler.RESULT.EXIT) {
            return CardTestHandler.RESULT.EXIT;
        }
        
    }

    async startTest(){
        console.log(this.cards)
        while (this.cards.length > 0) {
            const result = await this.testNextCard();
            if (result == CardTestHandler.RESULT.EXIT) {
                break;
            }
        }
        
    }

}