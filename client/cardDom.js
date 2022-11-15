class CardDom {

    constructor(card) {
        console.log(card)
        if (!card || !card instanceof Card) throw "I NEED A VALID CARD DAMNIT"
        this.card = card;
    }


    getHTML() {

        return `
        <div class="card mx-auto" id="card-${this.card.id}" style="max-width: 18rem;">
            <div class="card-body">
            ${this.getModalBody()}
            </div>
        </div>`

    }

    getModalBody() { 
        return `
            ${this.getCardText()}
            ${this.getCardDueDate()}
            ${this.getCardButtons()}
        `
    }

    getCardText(){
        return `<p class="card-text">
            ${this.card.front}
        </p>`
    }

    getCardDueDate(){

        let s;
        let diff = this.card.getDueDateCount()
        switch(diff){
            case 0:
                s = "<span class=\"dueText DUE\">Now!"
                break;
            case 1: s = "Tomorrow!"
                break;
            default: s = `Due in ${diff} days.`
                break;
        }

        return `<p class="card-text">
            <b>Due:</b> ${s}
            </p>`
    }

    getCardButtons(){

        return `<a href="#" class="btn btn-primary editCardBtn" id="${this.card.id}-edit" data-card-id="${this.card.id}">Edit</a>
        
        <a href="#" class="btn btn-danger" 
        onclick="CardDom.removeButtonHandler()" 
        id="${this.card.id}-remove" data-card-id="${this.card.id}">Remove</a>`
    }



}

CardDom.removeButtonHandler = (event) => {
    // console.log(event)
    if (!event) return 
    event.preventDefault()
    let element = $(event.currentTarget)
    let id = element.attr('data-card-id')
    
    const secondsUntilCooldown = 5

    if (!element.prop('isWarned')){
        element.prop('isWarned', true)

        element.html(`Are you sure? (${secondsUntilCooldown})`)
        setTimeout(() => {
            if (element) {
                element.prop('isWarned', false)
                element.html("Remove")
            }
        }, secondsUntilCooldown * 1000)

        for (let i = 1; i < secondsUntilCooldown; i++){
            console.log("Set button timeout for " + i)
            setTimeout(() => {
                console.log(i)
                console.log(element)
                if (element) 
                    element.html(`Are you sure? (${i})`)
            }, (secondsUntilCooldown - i) * 1000)

        }
    } else {
        let req = new XMLHttpRequest()
        req.open('PUT', window.location.origin + "/removeCard")
        req.send(id)
        
        req.addEventListener("load", (response) => {
            console.log(response)
            enableAddCardModalButton()
            console.log(response.target.status)
            if (response.target.status == 200){
                // this is bad but i am lazy
                grabData()
            }
        })
    }

    // console.log(id)
}

CardDom.editButtonHandler = (event) => {
    if (!event) return 
    event.preventDefault()
    let id
    if (event.currentTarget.attributes['data-card-id'])
        id = event.currentTarget.attributes['data-card-id'].value

    editCardButtonHandler(event, id)
    // console.log("E")
    // the rest of this is handled in init.js
       
}

CardDom.registerButtonHandlers = () => {
    $('.card-body > a').each((index, element) => {
        let suffix = element.id.split('-')[1]
        if (suffix){
            if (suffix == 'remove')
                $(element).click(CardDom.removeButtonHandler)
            if (suffix == 'edit')
                $(element).click(CardDom.editButtonHandler)
                // this is in init.js
        }
    })
}