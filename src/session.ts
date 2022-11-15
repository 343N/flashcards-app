// manages user sessions
import * as fs from 'fs';
import { IncomingMessage as Request, ServerResponse as Response } from "http";
import * as cookie from "cookie";
import * as util from "./util";
import Card from "./card";
import SETTINGS from './settings'

const SERVERPORT = SETTINGS.serverPort
const tokenLength = SETTINGS.tokenLength
const datapath = SETTINGS.dataPath
const userdatapath = datapath + 'userdata/'

class SessionManager {

    private static instance: SessionManager;

    private sessions = new Set();


    private constructor() {
        this.loadSessionList()
    }

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }

        return SessionManager.instance;
    }

    public getSessionCards(session: string): { [id: string]: Card } {
        this.createSessionFolder(session)
        let cardspath = userdatapath + session + '/cards.json'
        if (!fs.existsSync(cardspath)) {
            fs.openSync(cardspath, 'w')
            return {};
        }

        let filedata: string = fs.readFileSync(cardspath).toString()
        let cards = (filedata.length > 0) ? JSON.parse(filedata) : {};

        for (let c in cards) {
            cards[c] = new Card(cards[c])
        }

        return cards;
    }

    isSessionValid(session: string) {
        return this.sessions.has(session);
    }

    getSessionFromRequest(req: Request): string | undefined {

        let cookies = (req.headers.cookie) ? cookie.parse(req.headers.cookie) : {}
        if (cookies['token'])
            return cookies['token']
        else return undefined;
    }

    addSessionCard(session: string, card: Card): boolean {
        if (!this.isSessionValid(session))
            return false

        if (!this.isValidCard(card) || this.isDuplicateCard(session, card))
            return false

        let cards = this.getSessionCards(session)

        let cardID: string
        do {
            cardID = util.generateRandomKey(5)
        } while (cardID in cards)

        //ecmascript means this is safe
        card.id = cardID
        cards[cardID] = card;

        return this.saveSessionCards(session, cards)

    }

    transferSession(req: Request, res: Response, newSession: string): boolean {
        let oldSession = this.getSessionFromRequest(req)
        if (!oldSession || !this.isSessionValid(oldSession))
            return false

        let oldCards = this.getSessionCards(oldSession)
        let newCards = this.getSessionCards(newSession)

        let cards = Object.assign(newCards, oldCards)        
        
        this.saveSessionCards(newSession, cards)
        res.setHeader('Set-Cookie', 'token=' + newSession)
        return true

    }


    isValidCard(card: Card): boolean {
        if (!card.front || !card.back)
            return false;

        return (card.front.trim().length > 0 &&
            card.back.trim().length > 0)

    }

    isDuplicateCard(session: string, card: Card): boolean {

        let cards = this.getSessionCards(session);
        for (let n in cards) {
            let c = cards[n]
            console.log("Comparing " + n + " with " + c.id)
            console.log(card.fingerprint)
            console.log(c.fingerprint)
            if (c.fingerprint == card.fingerprint) {
                console.log("DUPLICATE CARD FOUND!!!!")
                return true
            }
        }


        return false

    }

    saveSessionCards(session: string, cards: { [id: string]: Card }): boolean {
        if (!this.isSessionValid(session))
            return false
        let json = JSON.stringify(cards, null, 2)
        let cardspath = userdatapath + session + '/cards.json'

        this.createSessionFolder(session)
        fs.writeFileSync(cardspath, json)
        console.log("Cards saved for " + session)
        // console.log(cards)

        return true
    }

    createSessionFolder(session: string): void {
        if (!fs.existsSync(datapath))
            fs.mkdirSync(datapath)
        if (!fs.existsSync(userdatapath))
            fs.mkdirSync(userdatapath)
        if (!fs.existsSync(userdatapath + session))
            fs.mkdirSync(userdatapath + session)
    }


    loadSessionList(): Set<string> {
        let setData: Array<string> =
            fs.existsSync(datapath + 'sessions.txt') ?
                fs.readFileSync(datapath + 'sessions.txt').toString().split('\n') :
                []

        return this.sessions = new Set(setData);


    }


    saveSessionList(): void {
        let s = ""
        for (let i of this.sessions)
            s = s + i + "\n"

        fs.writeFileSync(datapath + 'sessions.txt', s)

    }

    handleNewSession(req: Request, res: Response): void {
        let cookies = (req.headers.cookie) ? cookie.parse(req.headers.cookie) : {}
        // console.log(cookie.parse(req.headers.cookie))
        console.log(cookies)

        let key = cookies['token']
        if ((key && !this.sessions.has(key)) || !key) {

            do {
                key = util.generateRandomKey(tokenLength)
            } while (this.sessions.has(key))

            res.setHeader('Set-Cookie', 'token=' + key)
        }

        this.sessions.add(key)
        this.saveSessionList()
        this.createSessionFolder(key)

    }


}



export default SessionManager;