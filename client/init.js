let cards = [];
let cardDict = {}
let dueCardsQueue = [],
    untouchableCards = {}
let correctCards = 0,
    incorrectCards = 0;
let currentCard, currentCardIndex, hasFlipped

let SYNC_DATA = {}

const SETTINGS = {
    notifications: false,
    token: ""
}

function initAddModalFunctionality() {

    let form = $('#addCardForm')
    form.submit((e) => {

        disableAddCardModalButton()
        e.preventDefault();
        let vals = form.serializeArray()
        sendAddCardRequest(vals)

    })


}

// this could be abstracted into one general function
// but i'm way too fucking tired. @ 28-09-2020 12:01AM
function initEditModalFunctionality() {
    let form = $('#editCardForm')
    form.submit((e) => {

        e.preventDefault();
        let id = form.attr('data-card-id')
        if (!id) throw "form has no ID, can't update!"
        // console.log(e)
        disableEditCardModalButton()

        let vals = form.serializeArray()
        vals.push({
            name: "id",
            value: id
        })
        // console.log(vals)
        console.log(vals)

        sendEditCardRequest(vals)

    })

}


function sendEditCardRequest(data) {
    disableAddCardModalButton()
    let table = {}
    for (let pair of data) {
        console.log(pair)
        table[pair["name"]] = pair["value"]
    }

    let req = new XMLHttpRequest()

    // console.log(data)
    req.open('PUT', window.location.origin + "/editCard")
    req.send(JSON.stringify(table))

    req.addEventListener("load", (response) => {
        console.log(response)
        enableEditCardModalButton()
        console.log(response.target.status)
        if (response.target.status == 200) {
            closeEditModal();
            clearEditModalContents();
            initializeCards(JSON.parse(response.target.response))
        }
    })
}

function rebuildCardList() {
    listContainer = $("#cardsList")[0]
    // .get()
    // listContainer.empty()

    let headingContainer = listContainer.querySelector('.headingContainer')
    let cardsContainer = listContainer.querySelector('#cardsContainer')
    if (!headingContainer) {
        headingContainer = document.createElement("div")
        headingContainer.classList.add("container")
        headingContainer.classList.add("headingContainer")
        let heading = document.createElement("h2")
        heading.textContent = "Cards"



        headingContainer.append(heading)
        // headingContainer.append(`${cards.length} total`)
        listContainer.append(headingContainer)
    }

    if (!cardsContainer) {
        cardsContainer = document.createElement("div")
        cardsContainer.id = "cardsContainer"
        cardsContainer.classList.add('container')
        listContainer.append(cardsContainer)
    }

    cardsContainer.replaceChildren()
    for (let card of cards) {
        let cd = new CardDom(card)
        cardsContainer.append(cd.getHTML())
        cd.adjustTextSize()
    }

    CardDom.registerButtonHandlers()

}

function updateCardOverview() {
    let dueCount = 0;

    let dueElement = $('#dueCardCount')
    let totalElement = $('#totalCardCount')

    for (let c in cards)
        if (cards[c].getDueDateCount() == 0) dueCount++;

    dueElement.html(dueCount)
    totalElement.html(cards.length)

    let s = (dueCount == 1) ? 'flashcard' : 'flashcards'
    if (dueCount > 0) {
        $("#completeCardsButton").html(`Complete <b>${dueCount}</b> ${s} due today`)
        $("#completeCardsButton").prop('disabled', false)
    }
    if (dueCount == 0) {
        $("#completeCardsButton").html(`No flashcards due today!`)
        $("#completeCardsButton").prop('disabled', true)
    }

}


function removeCardData(id) {
    for (let c in cards)
        if (cards[c].id == id) {
            cards.splice(c, 1)
            break;
        }
    updateCardOverview()
}

function handleBackEvent() {
    window.addEventListener('popstate', (event) => {
        if (sideNavOpen()) {
            closeSideNav()
            event.preventDefault()
        }
    })
}

function getDueCards() {
    let dueCards = [];
    for (let c in cards)
        if (cards[c].getDueDateCount() == 0)
            dueCards.push(cards[c]);

    return dueCards;
}


function enableAddCardModalButton() {
    $('#addCardModal-submit').prop('disabled', false)
}

function disableAddCardModalButton() {
    $('#addCardModal-submit').prop('disabled', true)
}

function enableEditCardModalButton() {
    $('#editCardModal-submit').prop('disabled', false)
}

function disableEditCardModalButton() {
    $('#editCardModal-submit').prop('disabled', true)
}


function closeAddModal() {
    $('#addFlashcardModal').modal('hide');
}

function closeEditModal() {
    $('#editFlashcardModal').modal('hide');
}

function handleFlipCard() {
    let card = currentCard
    $("#completeCardText").html(
        ($("#completeCardText").html() == card.front) ?
        card.back :
        card.front
    )
    if (!hasFlipped) {
        $("#completeCardCorrectBtn").prop('disabled', false)
        $("#completeCardIncorrectBtn").prop('disabled', false)
        hasFlipped = true;
    }

}



function prepareCardComplete(card) {
    if (!card) card = dueCardsQueue[currentCardIndex]
    hasFlipped = false
    $("#completeCardText").html(card.front);
    $("#completeCardCorrectBtn").prop('disabled', true)
    $("#completeCardIncorrectBtn").prop('disabled', true)
}

function handleCompleteCard(isCorrect) {
    console.log(isCorrect)
    if (!currentCard.hasBeenProcessed) {

        if (isCorrect) {
            correctCards++;
            currentCard.stage++;
        }
        if (!isCorrect) {
            correctCards.stage = 0;
            incorrectCards++;
        }

        currentCard.hasBeenProcessed = true
    }

    currentCard.lastCompletion = new Date()
    currentCard.wasCorrect = isCorrect

    if (isCorrect) {
        updateCard(currentCard, (response) => {
            console.log("SAVED CARD DATA!!!")
            console.log(response)
            if (response.target.status == 200)
                nextCardInQueue();
            else
                alert("Server error. Try again later.")
        })
    } else nextCardInQueue();



}

function nextCardInQueue() {
    currentCard = dueCardsQueue[++currentCardIndex]
    // purge all the cards that were correctly completed.
    if (!currentCard) {
        let untouchableCards;
        untouchableCards = getCorrectCardsCount()
        if (untouchableCards == dueCardsQueue.length) {
            $("#completeCardModalBody").empty()
            $("#completeCardModalBody").html("All done!")
            grabData()
            return
        } else {
            currentCardIndex = 0;
            currentCard = dueCardsQueue[currentCardIndex]
        }
    }

    if (currentCard.wasCorrect)
        nextCardInQueue()
    else {
        prepareCardComplete(currentCard)
    }


}

function getCorrectCardsCount() {
    let count = 0
    for (let c in dueCardsQueue) {
        console.log(c)
        if (dueCardsQueue[c].wasCorrect)
            count++
    }

    return count
}

async function updateCardAsync(card) {
    let req = new XMLHttpRequest()
    req.open('PUT', window.location.origin + "/updateCard")
    req.send(serializeCard(card))
    return new Promise((resolve, reject) => {
        req.addEventListener("load", (event) => {
            resolve(req)
        })
    })

}

function updateCard(card, handler) {
    let req = new XMLHttpRequest()
    req.open('PUT', window.location.origin + "/updateCard")
    req.addEventListener("load", handler);
    // req.addEventListener("load", () =>{
    //     console.log("SAVED CARD DATA!!!")
    // });
    req.send(serializeCard(card))

}

function getTransformProperties(element){
    if (element == null) return;
    const regex = /([^ \(\)]+)\(([^)]*)\)+/g
    const transform = element.style.transform
    const properties = {}
    for (let match of transform.matchAll(regex)){
        properties[match[1]] = match.length > 2 && match[2] || ""
    }

    return properties
}

function setTransformProperties(element, properties, merge=false){
    if (element == null) return;
    if (properties == null) return (element.style.transform = "")
    if (merge) properties = { ...getTransformProperties(element), ...properties }

    const transform = Object.keys(properties).map(key => `${key}(${properties[key]})`).join(" ")
    element.style.transform = transform
}


async function initCompleteCards() {
    if (cards.length == 0) return;
    $("#completeCardsButton").prop('disabled', true)
    const handler = new CardTestHandler(cards)
    await handler.startTest()
    await delay(250)
    updateCardOverview()
    // $("#completeCardsButton").prop('disabled', false)

}

function clearAddModalContents() {
    let list = $('#addCardForm > .modal-body > .form-group > textarea')
    for (let i = 0; i < list.length; i++)
        list[i].value = ""
}

function clearEditModalContents() {
    let list = $('#editCardForm > .modal-body > .form-group > textarea')
    for (let i = 0; i < list.length; i++)
        list[i].value = ""
}

function sendAddCardRequest(data) {

    disableAddCardModalButton()
    let table = {}
    for (let pair of data) {
        console.log(pair)
        table[pair["name"]] = pair["value"]
    }

    let req = new XMLHttpRequest()

    // console.log(data)
    req.open('PUT', window.location.origin + "/addCard")
    req.send(serializeCard(table))
    
    req.addEventListener("load", (response) => {
        console.log(response)
        enableAddCardModalButton()
        console.log(response.target.status)
        if (response.target.status == 200) {
            closeAddModal();
            clearAddModalContents();
            initializeCards(JSON.parse(response.target.response))
        }
    })
}

function initializeCards(list) {
    cards = [];
    cardDict = {};
    for (let card in list) {
        let c 
        if (shouldDecrypt()){
            c = new Card(deserializeCard(list[card]))
        } else {
            c = new Card(list[card])
        }
        if (c.getDueDateCount() != -1)
            cards.push(c)
        cardDict[c.id] = c
    }

    rebuildCardList()
    updateCardOverview()

    if (!shouldDecrypt())
        updateCardAsync(card)

}

function grabData() {
    console.log("Grabbing data...")
    let req = new XMLHttpRequest()

    req.open("GET", window.location.origin + "/getCards")
    req.addEventListener("load", (response) => {
        console.log(response)
        console.log(response.target.status)
        if (response.target.status == 200) {
            initializeCards(JSON.parse(response.target.response))
            initPage()
        }
    });


    req.send();
}

function initPage() {
    if (!Cookies.get('token') || Cookies.get('token').length == 0) throw "NO COOKIE!"
    $('#cardsList').css('display', 'block')
    $('#cardsOverview').css('display', 'block')
    // $('#settingsUserTokenInput').val(Cookies.get('token'))
    $('#notificationsCheckbox').change((e) => {
        toggleNotificationPermission(e)
    })
    hideAllAlerts()
    handleBackEvent()

    grabSettings()
}

function grabSettings() {
    SETTINGS.notifications = Cookies.get('notifications') || false
    SETTINGS.token = Cookies.get('token')
}

function copyToken() {
    navigator.clipboard.writeText(Cookies.get('token'))
        .then((a, b, c) => {
            console.log("Copied to clipboard!")
        }).catch(console.error)
}

function toggleNotificationPermission(e) {
    if (e.target.checked)
        Notification.requestPermission().then((a) => {
            if (a === 'denied') {
                showAlert('deniednotifications')
                e.target.checked = false
            }
        })

    SETTINGS.checked = e.target.checked
    Cookies.set('notifications', true);
}

function openSettingsModal() {
    console.log("Opening Settings Modal")
    // $('#notificationsCheckbox').prop('checked', Boolean(SETTINGS.notifications))
    retrieveSyncData()
    openSideNav()
    // $('#settingsUserTokenInput').val(SETTINGS.token)
}

function openSideNav() {
    $("nav#sidenav").addClass('active')
    $("div#sidenavcover").addClass('active')
    // $("body").addClass('active')
}

function closeSideNav() {
    if ($("div#sidenavcover").hasClass("flashcard-cover")) {
        ExpandedCard.close()
    } else {
        $("nav#sidenav").removeClass('active')
        $("div#sidenavcover").removeClass('active')
    }

}

function sideNavOpen() {
    return $("nav#sidenav").hasClass('active')
}

function closePageCover() {
    $("div#sidenavcover").removeClass('active')
}



function showAlert(alertname, a, b, c) {
    alerts[alertname.toLowerCase()](a, b, c)
}

function retrieveSyncData() {
    return "Disabled, for now"
    let req = new XMLHttpRequest()
    req.open("GET", window.location.origin + "/sync")
    req.addEventListener("load", (response) => {
        console.log(response)
        console.log(response.target.status)

        if (response.target.status == 200) {
            SYNC_DATA = JSON.parse(response.target.response)
            $("#SETTINGS_SYNC_CODE").text(SYNC_DATA.code)
        }
    })

    req.send()
}

function drawPoint(x, y, color = "red") {
    let div = document.createElement("div")
    div.style.backgroundColor = color
    div.style.width = "3px"
    div.style.height = "3px"
    div.style.display = "block"
    div.style.position = "fixed"
    div.style.left = (x - 1) + "px"
    div.style.top = (y - 1) + "px"

    document.documentElement.appendChild(div)
}

function drawCornersOfElement(element) {
    let rect = element.getBoundingClientRect()
    drawPoint(rect.left, rect.top)
    drawPoint(rect.right, rect.top)
    drawPoint(rect.left, rect.bottom)
    drawPoint(rect.right, rect.bottom)
}


function hideAllAlerts() {
    $('div').each((i, e) => {
        if (e.attributes.role && e.attributes.role.value == 'alert')
            e.style.display = 'none'
    })
}

function doSync() {
    return "Disabled, for now"
    let code = $("#settingsUserTokenInput").val()
    let req = new XMLHttpRequest()
    req.open("POST", window.location.origin + "/sync")
    req.addEventListener("load", (response) => {
        if (response.target.status == 200) {
            let newData = JSON.parse(response.target.response)
            initializeCards(newData)
            closeSideNav()
            retrieveSyncData()
        }
    });

    req.send(code)
}

// a dictionary of cards would work better but it's too late now
// lmao
function getCard(id) {
    return id in cardDict && cardDict[id] || null;
}

function shouldDecrypt(){
    if (!localStorage.getItem("key")) 
        return false
}

function editCardButtonHandler(event, cardId) {
    console.log(event)
    event.preventDefault()

    let element = $(event.currentTarget)
    console.log('cardID', cardId)
    let id = cardId || event.currentTarget.attributes['data-card-id'].value
    let card = getCard(id)
    if (!card) return

    $('#editCardModal-front').val(card.front)
    $('#editCardModal-back').val(card.back)
    $('#editFlashcardModal').modal('show')
    $('#editCardForm').attr('data-card-id', id)
    // $('#editFlashcardModal').modal('show')



}

function getCardData(cardId) {
    let card = getCard(cardId)
    if (!card) return

    return {
        front: card.front,
        back: card.back
    }
}

const alerts = {}

function request(method, url, data = null) {
    return new Promise((res, rej) => {
        if (!method || !url) rej("Invalid request")
        const req = new XMLHttpRequest()
        req.open(method, url)
        req.addEventListener("load", (event) => {
            const response = event.target
            response.status == 200 ? res(response) : rej(response)
        })
        req.addEventListener('timeout', (e) => {
            rej(e)
        })
        req.send(data)
    })

}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Description placeholder
 * @date 06/03/2024 - 5:25:05 pm
 *
 * @param {Object} card
 * @returns {*}
 */
function serializeCard(card){
    // do we use the setter toplevel or bottomlevel name?
    if (card.constructor == Card){
        card = card.toJSON()
    }
    let serializedCard = {}
    Object.assign(serializedCard, card)
    console.log(card)
    for (f of ["_front", "_back", "front", "back"]){
        console.log(f)
        console.log(card[f])
        if (card.hasOwnProperty(f) && f) serializedCard[f] = encrypt(card[f])
        console.log(card.hasOwnProperty(f))
    } // fields to encrypt because lol
    
    return JSON.stringify(serializedCard)
}

function deserializeCard(card){
    card.front = decrypt(card.front)
    card.back = decrypt(card.back)
    return card
}

function deserializeCardJson(card){
    return deserializeCard(JSON.parse(card))
}

alerts['deniednotifications'] = () => {
    $('#disablednotificationsAlert').css('display', '')
}

initAddModalFunctionality()
initEditModalFunctionality()