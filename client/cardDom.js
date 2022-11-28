const MAX_FONT_SIZE = 16
const MIN_FONT_SIZE = 4



class CardDom {

    static instances = {}

    static MAX_FONT_SIZE = MAX_FONT_SIZE
    static MIN_FONT_SIZE = MIN_FONT_SIZE

    constructor(card) {
        console.log(card)
        if (!card || !card instanceof Card) throw "I NEED A VALID CARD DAMNIT"
        this.card = card;
        this.element = this.getHTML()
        CardDom.instances[this.card.id] = this
    }


    getHTML() {

        if (this.element) return this.element
        const flashcardDiv = document.createElement("div")
        flashcardDiv.classList.add("card")
        flashcardDiv.classList.add("flashcard")
        flashcardDiv.style['max-width: 18rem']
        flashcardDiv.dataset.cardId = this.card.id
        flashcardDiv.addEventListener('click', ExpandedCard.expandHandler)
        // flashcardDiv.innerHTML = this.getCardBody()


        const span = document.createElement("span")
        span.innerText = this.getCardBody()
        flashcardDiv.appendChild(span)


        this.element = flashcardDiv
        return this.element

    }

    // getElement {
    //     return ``
    // }

    getCardBody() {
        return this.card.front
    }

    // adjust the text size to fit in the card.
    adjustTextSize() {
        if (!this.element) return;
        let card = this.element
        let span = card.querySelector("span")

        const getSpanFontSize = () => span.computedStyleMap().get('font-size').value
        const getParentHeight = () => card.getBoundingClientRect().height
        const getSpanHeight = () => span.getBoundingClientRect().height


        // pixels to *shrink* font-size by
        const AMNT = 1
        // avoid infinite loops (THESE SHOULDN'T HAPPEN!)
        const timesince = Date.now()
        // max font size in px
        console.log(getSpanHeight(), getParentHeight())
        while (getSpanHeight() > getParentHeight() - 5) {
            const size = getSpanFontSize()
            console.log(getSpanHeight(), getParentHeight())
            span.style.fontSize = (size - AMNT) + "px";
            // await delay(1000)
            // if (i == 100) break;
            // console.log(size)
            // console.log(CardDom.MAX_FONT_SIZE)
            if (size <= ExpandedCard.MIN_FONT_SIZE) break;
            if (Date.now() - timesince > 1000) {
                throw "INFINITE LOOP, FIX THIS 💀💀"
            };

        }
    }




    getCardDueDate() {

        let s;
        let diff = this.card.getDueDateCount()
        switch (diff) {
            case 0:
                s = "<span class=\"dueText DUE\">Now!"
                break;
            case 1:
                s = "Tomorrow!"
                break;
            default:
                s = `Due in ${diff} days.`
                break;
        }

        return `
            
        <p class="card-text">
            <b>Due:</b> ${s}
            </p>`
    }

    getCardButtons() {

        return `<a href="#" class="editButton button" id="${this.card.id}-edit" data-card-id="${this.card.id}"><i class="fas fa-pen"></i></a>
        `

    }

    get text() {
        return this.element.children[0].innerText
    }
    set text(t) {
        this.element.children[0].innerText = t
    }

    set textSize(t) {
        this.element.style.fontSize = t
    }
    get textSize() {
        return this.element.style.fontSize
    }

    update() {
        this.text = this.getCardBody()
        this.adjustTextSize()
    }

    hide() {
        this.element.classList.add("hidden")
    }

    show() {
        this.element.classList.remove("hidden")
    }

    cloneNode(deep) {
        return this.element.cloneNode(deep)
    }

    bounds() {
        return this.element.getBoundingClientRect()
    }

    remove() {
        this.element.remove()
    }


    // get the instance of the card dom object by the card's ID
    static get(id) {
        return CardDom.instances[id]
    }

}



class ExpandedCard {

    static SAVE_STATUS = {
        SAVING: 0,
        SAVED: 1,
        ERROR: 2
    }



    static CURRENT = null
    static MAX_FONT_SIZE = MAX_FONT_SIZE

    constructor(cardData, baseCard) {
        this.cardData = cardData;
        this.baseCard = baseCard
        this.flipCount = 0;
        this.flipped = false
        this.events = {}
    }

    getScale() {
        const sizeToPageW = this.baseCard.element.clientWidth / window.innerWidth
        // const sizeToPageH = this.baseCard.clientHeight / window.innerHeight
        const MAX_WIDTH_RATIO = 0.333
        const calcScaleW = (MAX_WIDTH_RATIO / sizeToPageW)
        let scale = Math.max(1, calcScaleW);
        return scale
    }

    create(editing = false, testing=false) {
        this.editing = editing
        this.testing = testing
        
        ExpandedCard.showPageCover()
        const expandedFront = this.baseCard.cloneNode(true)
        console.log(this.baseCard)
        const fontsize = expandedFront.querySelector("span").style.fontSize
        expandedFront.style.fontSize = fontsize

        const {
            left,
            top,
            width,
            height
        } = this.baseCard.bounds()
        // console.log(left, top)
        const leftpct = (left / window.innerWidth) * 100
        const toppct = (top / window.innerHeight) * 100
        // console.log(leftpct, toppct)
        expandedFront.style.left = leftpct + "%"
        expandedFront.style.top = toppct + "%"
        this.baseCard.hide()
        // expandedFront.style.width = width + "px"
        // expandedFront.style.height = height + "px"



        let textInput = document.createElement("span")
        // textInput.type = "text"
        if (editing) textInput.setAttribute('contenteditable', true)
        textInput.addEventListener('click', function (e) {
            e.stopPropagation()
        })

        // adjust the font-size so everything fits
        textInput.addEventListener("input", this.adjustFontSize)


        textInput.classList.add('text-light')
        textInput.innerText = expandedFront.innerText.trim()
        // textInput.setAttribute('rows', '1')
        expandedFront.innerText = ""
        expandedFront.appendChild(textInput)

        // add loading/saving icon
        const icon = document.createElement('i')
        icon.classList.add('removed')
        icon.classList.add('fas')
        icon.classList.add('fa-spinner')
        icon.classList.add('fa-spin')
        icon.classList.add('saveStatus')
        expandedFront.appendChild(icon)
        // icon.classList.add(invisible)

        expandedFront.classList.add("text-light")
        expandedFront.classList.add("expanded")

        document.documentElement.appendChild(expandedFront);


        expandedFront.addEventListener('transitionend', this.transition_end_handler.bind(this))



        // width = expandedFront.clientWidth, height = expandedFront.clientHeight;
        // expandedCard.style.width = "50%";


        const scale = this.getScale()
        expandedFront.style.transform = `translate(-50%, -50%) scale(${scale})`;
        expandedFront.style.left = "50%";
        expandedFront.style.top = "50%";

        window.addEventListener('resize', () => this.resize())

        // flip on click
        // expandedFront.addEventListener('click', (event) => {
        //     console.log("FLIPPING!")
        //     this.flip()
        // })

        this.frontElement = expandedFront

        ExpandedCard.CURRENT = this
        return this

    }

    adjustFontSize(event) {
        console.log(event)

        const getSpanFontSize = () => event.target.computedStyleMap().get('font-size').value
        const getParentHeight = () => event.target.parentElement.getBoundingClientRect().height
        const getSpanHeight = () => event.target.getBoundingClientRect().height

        // console.log(event)
        const SHRINK = event.inputType.includes("insert") ? true : false
        // pixels to adjust font-size by
        const PIXEL_ADJUST_VAL = 1
        const AMNT = PIXEL_ADJUST_VAL * (SHRINK ? -1 : 1)
        // avoid infinite loops (THESE SHOULDN'T HAPPEN!)
        const timesince = Date.now()
        // max font size in px

        console.log(event)
        if (SHRINK) {
            // console.log(getSpanHeight(), getParentHeight())
            while (getSpanHeight() > (getParentHeight() - 5)) {
                const size = getSpanFontSize()
                // const [h1, h2] = [getSpanHeight(), getParentHeight()]
                event.target.style.fontSize = (size + AMNT) + "px";
                // await delay(1000)
                // if (i == 100) break;
                // console.log(getSpanHeight(), getParentHeight())
                if (size <= ExpandedCard.MIN_FONT_SIZE) break;
                if (Date.now() - timesince > 1000) {
                    throw "INFINITE LOOP/TAKEN MORE THAN A SECOND TO ADJUST FONTS, FIX THIS 💀💀"
                };
                console.log(getSpanHeight(), getParentHeight())

            }
        } else {
            if (getSpanFontSize() == ExpandedCard.MAX_FONT_SIZE) return;

            // console.log(last)
            let last
            while (getSpanHeight() < (getParentHeight() - 5)) {
                if (last == ExpandedCard.MAX_FONT_SIZE) break;
                last = getSpanFontSize()
                event.target.style.fontSize = (getSpanFontSize() + AMNT) + "px";
                console.log(last, getSpanFontSize())

                // avoid infinite loops.
                if (last == 1)
                    throw "Set 1 pixel font size. Something is probably wrong.";

                if (Date.now() - timesince > 1000) throw "INFINITE LOOP/TAKEN MORE THAN A SECOND TO ADJUST FONTS, FIX THIS 💀💀";



            }
            event.target.style.fontSize = last + 'px'

        }
    }

    addExitTestListener(func){
        if (this.testing) this.exitTestFunc = func;
    }


    flip() {
        this.flipCount++
        const scale = this.getScale()
        this.frontElement.style.transform = `translate(-50%, -50%) scale(${scale}) rotate3d(0,1,0,${180 * this.flipCount}deg)`
        this.backElement.style.transform = `translate(-50%, -50%) scale(${scale}) rotate3d(0,1,0,${180 * (this.flipCount + 1)}deg)`
        this.hideButtons()
        this.flipped = !this.flipped
    }

    hideButtons() {
        const curElement = this.flipped ? this.backElement : this.frontElement
        const buttons = curElement.querySelectorAll('.button')
        buttons.forEach(button => {
            button.classList.add('removed')
        })
    }


    showButtons() {
        if (this.destroying || this.closing) return;
        const curElement = this.flipped ? this.backElement : this.frontElement
        const buttons = curElement.querySelectorAll('.button')
        buttons.forEach(button => {
            button.classList.remove('removed')
        })

    }

    createButtons() {
        if (this.hasButtons) return;
        this.hasButtons = true
        const flipButton = document.createElement('i')
        flipButton.classList.add('fas')
        flipButton.classList.add('fa-undo')
        flipButton.classList.add('removed')
        flipButton.classList.add('button')
        // start invisible, we'll handle visibility in the transition end handler
        flipButton.classList.add('flipButton')
        flipButton.addEventListener('click', this.flipButtonHandler.bind(this))
        this.frontElement.appendChild(flipButton)

        if (this.editing){
            const trashButton = document.createElement('i')
            trashButton.classList.add('fas')
            trashButton.classList.add('fa-trash')
            trashButton.classList.add('removed')
            trashButton.classList.add('button')
            trashButton.classList.add('trashButton')
            trashButton.addEventListener('click', this.trashButtonHandler.bind(this))
            this.frontElement.appendChild(trashButton)
        }



    }


    




    transition_end_handler(event) {
        const currentEl = this.flipped ? this.backElement : this.frontElement
        if (!currentEl) throw "Something is wrong (no card element)"
        if (this.editing) {
            currentEl.children[0].focus()
        }
        console.log(this.destroying)
        this.createButtons()
        if (!this.backElement) this.createBack(this.frontElement)
        if (this.destroying) this.destroy()
        if (!this.closing) this.showButtons()
        
        console.log(event)
        this.fireEvents("transitionend", event)


    }

    add_transition_end_handler(func){
        this.transition_end_func = this.transition_end_func?.push(func) || [func]
    }

    // remove_transition_end_handler(func){
    // }

    // gets the trash button of the current face
    confirmingTrash() {
        const currentEl = this.flipped ? this.backElement : this.frontElement
        const trashButton = currentEl.querySelector('.trashButton')
        return trashButton.classList.contains('confirm')
    }

    async flipButtonHandler(e) {
        e.stopPropagation()
        this.flip()
    }


    async trashButtonHandler(e) {
        e.stopPropagation()
        const trashButton = e.target
        if (this.confirmingTrash()) {
            if (this.flipped) this.flip()
            this.hideButtons()
            this.showSaveStatus()
            this.setSaveStatus(ExpandedCard.SAVE_STATUS.SAVING)
            const [card, response] = await this.cardData.delete()
            const ERROR = response.status != 200
            console.log(response)
            const SUCCESS_STATUS = ERROR ? ExpandedCard.SAVE_STATUS.ERROR : ExpandedCard.SAVE_STATUS.SAVED
            this.setSaveStatus(SUCCESS_STATUS)
            // add some more delay if we're flipping sides.
            const DELAY = 500 + (this.flipped ? 300 : 0)
            if (this.flipped) this.flip()
            await delay(DELAY)
            if (ERROR) this.close(false)
            else this.trashCard(false)
        }
        trashButton.classList.add('confirm')
        setTimeout(() => {
            trashButton.classList.remove('confirm')
        }, 3000)
    }

    async trashCard(save=true) {
        const dims = this.frontElement.getBoundingClientRect()
        console.log(dims)
        const pos = {
            left: (-dims.width) * 2,
            top: window.innerHeight/2
        }
        this.baseCard.remove()
        this.close(save, {pos: pos, keep_scale: true, keep_centered: true})
        
    
    }


    createBack() {
        if (!this.frontElement) throw "NO FRONT ELEMENT, HOW DO YOU EXPECT US TO MAKE THE BACK, HUH? IT'S A DERIVATIVE!"
        const el = this.frontElement.cloneNode(true)
        const scale = this.getScale()
        el.style.transform = `translate(-50%, -50%) scale(${scale}) rotate3d(0,1,0,180deg)`
        document.documentElement.appendChild(el)
        el.classList.add('back')
        // el.addEventListener('click', (event) => {
        //     this.flip()
        // })
        const textInput = el.querySelector('span')
        textInput.addEventListener('click', function (e) {
            e.stopPropagation()
        })
        textInput.addEventListener('input', this.adjustFontSize)
        this.backElement = el
        this.backText = this.cardData.back.trim()
        // add button event listeners
        const flipButton = el.querySelector('.flipButton')
        flipButton?.addEventListener('click', (e) => {
            e.stopPropagation()
            this.flip()
        })
        const trashButton = el.querySelector('.trashButton')
        trashButton?.addEventListener('click', this.trashButtonHandler.bind(this))
        this.adjustFontSize({
            target: textInput,
            inputType: "insertText"
        })

        if (!this.testing) return;
        const testYes = document.createElement('i')
        testYes.classList.add('fas')
        testYes.classList.add('fa-check')
        testYes.classList.add('removed')
        testYes.classList.add('button')
        testYes.classList.add('testYes')

        const testNo = document.createElement('i')
        testNo.classList.add('fas')
        testNo.classList.add('fa-times')
        testNo.classList.add('removed')
        testNo.classList.add('button')
        testNo.classList.add('testNo')

        el.appendChild(testYes)
        el.appendChild(testNo)

    }


    
    // tests the card, returns a result as a promise
    async test(){
        if (!this.testing) return;

        // if the back element doesn't exist, wait until it's created (transition end handler)
        if (!this.backElement){
            await new Promise((res, rej) => {
                this.addEventListener('transitionend', res)
            })
        }

        const yesButton = this.backElement.querySelector('.testYes')
        const noButton = this.backElement.querySelector('.testNo')

        return new Promise((res, rej) => {
            yesButton.addEventListener('click', () => {
                res(CardTestHandler.RESULT.CORRECT)
            })
            noButton.addEventListener('click', () => {
                res(CardTestHandler.RESULT.INCORRECT)
            })
            this.addExitTestListener(() => {
                res(CardTestHandler.RESULT.EXIT)
            })

        }) 

    }



    isEdited() {
        const f = this.cardData.front != this.frontText
        // console.log(f, this.cardData.front)
        const b = this.cardData.back != this.backText
        return f || b

    }

    get frontText() {
        return this.frontElement.children[0].innerText
    }
    set frontText(text) {
        if (!this.frontElement.children.length) return
        const child = this.frontElement.children[0]
        child.innerText = text
    }

    get backText() {
        return this.backElement.children[0].innerText
    }
    set backText(text) {
        if (!this.backElement.children.length) return
        const child = this.backElement.children[0]
        child.innerText = text
    }

    // saves the card, and returns the new card data
    async save() {
        this.setSaveStatus(ExpandedCard.SAVE_STATUS.SAVING)
        this.showSaveStatus()
        this.cardData.front = this.frontText
        this.cardData.back = this.backText
        const [card, response] = await this.cardData.save(this.cardData)
        console.log(card, response)

        const ERROR = response.status != 200
        const SAVE_STATUS = ERROR ? ExpandedCard.SAVE_STATUS.ERROR : ExpandedCard.SAVE_STATUS.SAVED
        this.setSaveStatus(SAVE_STATUS)
        await delay(1000);
        this.hideSaveStatus()
        if (!ERROR) {
            this.cardData = card
            this.updateBaseCard()
        }

        return !ERROR
    }

    // sets the status icon type (either spinner, tick, or cross)
    setSaveStatus(status = ExpandedCard.SAVE_STATUS.SAVING) {

        // element.classList.remove('invisible')
        let element = this.getSaveStatusElement()
        console.log(element)
        switch (status) {
            case ExpandedCard.SAVE_STATUS.SAVING:
                element.classList.add('fa-spinner')
                element.classList.add('fa-spin')
                element.classList.remove('fa-check')
                element.classList.remove('fa-times')
                break;
            case ExpandedCard.SAVE_STATUS.SAVED:
                element.classList.remove('fa-spinner')
                element.classList.remove('fa-spin')
                element.classList.add('fa-check')
                element.classList.remove('fa-times')
                break;
            case ExpandedCard.SAVE_STATUS.ERROR:
                element.classList.remove('fa-spinner')
                element.classList.remove('fa-spin')
                element.classList.remove('fa-check')
                element.classList.add('fa-times')
                break;
        }
    }

    getSaveStatusElement() {
        return this.flipped ? this.backElement.querySelector('.saveStatus') : this.frontElement.querySelector('.saveStatus')
    }

    // shows the status icon on the card
    showSaveStatus() {
        this.getSaveStatusElement()?.classList.remove('removed')
    }

    // hides the status icon on the card
    hideSaveStatus() {
        this.getSaveStatusElement()?.classList.add('removed')
    }

    // refreshes base card data AND CRUCIALLY sets font size 
    updateBaseCard() {
        this.baseCard.update()
        this.baseCard.element.style.fontSize = this.frontElement.children[0].style.fontSize
    }

    // save: boolean, whether we should save before closing
    // options: {
    //     pos: {left: number, top: number}, position to move to when closing (default to basecard pos)
    //     keep_scale: boolean, whether to keep the current scale of the card when closing (default: false)
    //     destroy: whether to destroy the card after closing (default: true)
    // }
    async close(save=true, options=null) {
        if (this.closing) return
        // set options
        const opt = {
            pos: options?.pos || this.baseCard.bounds(),
            keep_scale: options?.keep_scale || false,
            keep_centered: options?.keep_centered || false,
            destroy: options?.destroy != undefined ? options.destroy : true,
            remove_cover: options?.remove_cover != undefined ? options.remove_cover : true,
        }
        console.log(opt)
        
        this.hideButtons()

        this.closing = true
        
        // this.destroying = opt.destroy
        if (this.exitTestFunc) this.exitTestFunc();
        if (save && ((this.editing && this.isEdited()) || this.testing)) {
            if (this.flipped) this.flip()
            await this.save()
            await delay(500)
        }
        if (opt.remove_cover) ExpandedCard.hidePageCover()
        ExpandedCard.CURRENT = null;
        
        // deactivatePageCover()
        
        if (this.flipped)
        this.flip()
        
        
        console.log(opt?.pos)
        let {
            left,
            top
        } = opt?.pos
        
        this.destroying = opt.destroy
        this.hideSaveStatus()
        let fr = this.frontElement
        fr.style.transition = "all 0.5s"
        fr.style.position = "absolute"
        fr.style.left = left + "px"
        fr.style.top = top + "px"
        // fr.style.width = width + "px"
        // fr.style.height = height + "px"
        let transform_addendum = opt.keep_scale ? `scale(${this.scale})` : ''
        transform_addendum += opt.keep_centered ? ` translate(-50%, -50%)` : ''
        fr.style.transform = `rotate3d(0,1,0,${180 * this.flipCount}deg) ` + transform_addendum
        fr.style["box-shadow"] = "0px 4px 4px rgba(0, 0, 0, 0.25)";
        
        let bk = this.backElement
        bk.style.transition = "all 0.5s"
        bk.style.position = "absolute"
        bk.style.left = left + "px"
        bk.style.top = top + "px"
        // bk.style.width = width + "px"
        // bk.style.height = height + "px"
        bk.style.transform = `rotate3d(0,1,0,${180 * (this.flipCount + 1)}deg` + transform_addendum
        bk.style["box-shadow"] = "0px 4px 4px rgba(0, 0, 0, 0.25)";



    }

    addEventListener(event, func) {
        event = event.toLowerCase()
        if (!(event in this.events))
            this.events[event] = [func]
        else 
            this.events[event].push(func)
    }

    fireEvents(eventName, eventData=null) {
        eventName = eventName.toLowerCase()
        if (eventName in this.events) 
            for (let func of this.events[eventName]) 
                func(this, eventData)
            
        
    }


    destroy() {
        this.fireEvents('preDestroy')

        this.backElement.remove()
        this.frontElement.remove()
        this.baseCard?.show()
        ExpandedCard.CURRENT = null;
        
        this.fireEvents('postDestroy')



    }

    resize(){
        console.log("RESIZING!!!")
        if (this.closing || this.destroying) return;
        this.setScale(this.getScale())       
        
    }

    getTransform(){
        return {front: getTransformProperties(this.frontElement), back: getTransformProperties(this.backElement)}
    }

    
    setTransform(options){
        if (!options) return;
        setTransformProperties(this.frontElement, options.front)
        setTransformProperties(this.backElement, options.back)
    }


    setScale(scale){
        const dims = this.getTransform()
        dims.front.scale = scale
        dims.back.scale = scale
        this.setTransform(dims)
    }

}




ExpandedCard.expandHandler = (event) => {
    if (!event) return;
    event.preventDefault();

    // console.log(event)
    // console.log(event.target)
    // console.log(event.target.dataset.cardId)
    // console.log(getCard(event.target.dataset.cardId))
    console.log(event)
    let c = new ExpandedCard(getCard(event.target.dataset.cardId), CardDom.get(event.target.dataset.cardId))
    c.create(true)

}


ExpandedCard.close = (save=null, options=null) => {
    let expandedCard = ExpandedCard.CURRENT
    expandedCard.close(save, options)
}

CardDom.removeButtonHandler = (event) => {
    // console.log(event)
    if (!event) return
    event.preventDefault()
    let element = $(event.currentTarget)
    let id = element.attr('data-card-id')

    const secondsUntilCooldown = 5

    if (!element.prop('isWarned')) {
        element.prop('isWarned', true)

        element.html(`Are you sure? (${secondsUntilCooldown})`)
        setTimeout(() => {
            if (element) {
                element.prop('isWarned', false)
                element.html("Remove")
            }
        }, secondsUntilCooldown * 1000)

        for (let i = 1; i < secondsUntilCooldown; i++) {
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
            if (response.target.status == 200) {
                // this is bad but i am lazy
                grabData()
            }
        })
    }

    // console.log(id)
}

ExpandedCard.showPageCover = () => {
    $("div#sidenavcover").addClass("flashcard-cover")
    $("div#sidenavcover").addClass("active")
}

ExpandedCard.hidePageCover = () => {
    $("div#sidenavcover").removeClass("flashcard-cover")
    $("div#sidenavcover").removeClass("active")
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
        if (suffix) {
            if (suffix == 'remove')
                $(element).click(CardDom.removeButtonHandler)
            if (suffix == 'edit')
                $(element).click(CardDom.editButtonHandler)
            // this is in init.js
        }
    })
}