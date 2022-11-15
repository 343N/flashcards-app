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
    let listContainer = $("#cardsList")
    listContainer.empty()
    listContainer.append(`
        <h2>Cards</h2>
        ${cards.length} total
        `)

    for (let c in cards)
        listContainer.append(new CardDom(cards[c]).getHTML())

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


function updateCard(card, handler) {
    let req = new XMLHttpRequest()
    req.open('PUT', window.location.origin + "/updateCard")
    req.addEventListener("load", handler);
    // req.addEventListener("load", () =>{
    //     console.log("SAVED CARD DATA!!!")
    // });
    req.send(JSON.stringify(card))

}


function initCompleteCards() {
    dueCardsQueue = getDueCards();

    if (dueCardsQueue.length == 0) return
    $('#completeCardModal').modal('show')
    hasFlipped = false
    correctCards = 0;
    incorrectCards = 0;
    currentCardIndex = 0;
    currentCard = dueCardsQueue[currentCardIndex]

    prepareCardComplete()
    // $('completeCardModal').modal('show')

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
    req.send(JSON.stringify(table))

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
    for (let card in list) {
        let c = new Card(list[card])
        if (c.getDueDateCount() != -1)
            cards.push(c)
    }

    rebuildCardList()
    updateCardOverview()

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
    $('#notificationsCheckbox').prop('checked', Boolean(SETTINGS.notifications))
    retrieveSyncData()
    // $('#settingsUserTokenInput').val(SETTINGS.token)
}

function showAlert(alertname, a, b, c) {
    alerts[alertname.toLowerCase()](a, b, c)
}

function retrieveSyncData() {
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


function hideAllAlerts() {
    $('div').each((i, e) => {
        if (e.attributes.role && e.attributes.role.value == 'alert')
            e.style.display = 'none'
    })
}

function doSync() {
    let code = $("#settingsUserTokenInput").val()
    let req = new XMLHttpRequest()
    req.open("POST", window.location.origin + "/sync")
    req.addEventListener("load", (response) => {
        if (response.target.status == 200) {
            let newData = JSON.parse(response.target.response)
            initializeCards(newData)
            retrieveSyncData()
        }
    });

    req.send(code)
}

// a dictionary of cards would work better but it's too late now
// lmao
function getCard(id) {
    for (let c of cards)
        if (c.id == id)
            return c

    return null
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


const alerts = {}

alerts['deniednotifications'] = () => {
    $('#disablednotificationsAlert').css('display', '')
}

initAddModalFunctionality()
initEditModalFunctionality()