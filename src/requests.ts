import { IncomingMessage as Request, ServerResponse as Response } from "http";
import { Session } from "inspector";
import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";
import Card from './card'
import SessionManager from "./session";
import { SyncManager, SyncData } from './sync'
import { syncBuiltinESMExports } from "module";


class RequestHandler {

    private static instance: RequestHandler;

    static getInstance(sm: SessionManager): RequestHandler {
        if (!RequestHandler.instance) {
            RequestHandler.instance = new RequestHandler(sm);
        }

        return RequestHandler.instance;
    }

    private sm: SessionManager;
    private constructor(sm: SessionManager) {
        this.sm = sm;
    }

    public doDefaultRequest(req: Request, res: Response, options: HandlerOptions): void {
        if (!res) return;
        if (req.method == undefined) return DEFAULT_REQUESTS["*"](req, res, options);
        if (req.method in DEFAULT_REQUESTS) return DEFAULT_REQUESTS[req.method](req, res, options);
    }


    public handleRequest(req: Request, res: Response): void {
        if (req.method == undefined) return this.doDefaultRequest(req, res, new HandlerOptions())

        let options = new HandlerOptions({ sm: this.sm });
        if (!(req.method in REQUESTS) || req.url == undefined)
            return this.doDefaultRequest(req, res, options);

        // for easy parsing of the URL
        let url = new URL(req.url, 'http://localhost/');
        if (url.pathname in REQUESTS[req.method])
            return REQUESTS[req.method][url.pathname](req, res, options);

        console.log(this)
        return this.doDefaultRequest(req, res, options);

    }




}

const DEFAULT_REQUESTS: any = {
    "*": (req: Request, res: Response, options: HandlerOptions): void => {
        res.writeHead(404)
        res.end()
    },
    "GET": (req: Request, res: Response, options: HandlerOptions): void => {
        console.log(options)
        if (options.sm == undefined) throw "NO SESSION MANAGER!"
        const sm: SessionManager = options.sm;
        let filepath = "./client"

        filepath = (req.url === "/") ? filepath + "/index.html" : filepath + req.url

        console.log(filepath)
        if (fs.existsSync(filepath)) {
            sm.handleNewSession(req, res)
            res.setHeader('Content-Type', mime.contentType(path.extname(filepath)) as string)
            res.writeHead(200)
            res.end(fs.readFileSync(filepath))
            // console.log(req.headers)
        } else res.writeHead(404)

        res.end()
    }

}

const GET_REQUESTS: any = {
    '/getCards': (req: Request, res: Response, options: HandlerOptions): void => {

        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;

        let curSess = sm.getSessionFromRequest(req)
        if (curSess) {
            res.writeHead(200)
            let cards = sm.getSessionCards(curSess)
            res.write(JSON.stringify(cards))
        } else
            res.writeHead(500)

        res.end()


    },
    '/sync': async (req: Request, res: Response, options: HandlerOptions) => {

        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;

        let session = sm.getSessionFromRequest(req)
        if (!session) {
            res.writeHead(400)
            res.end()
            return
        }

        const SYNC = SyncManager.getInstance()
        let payload = SYNC.createSyncSession(session)

        res.writeHead(200)
        res.write(JSON.stringify(payload))
        res.end()

    },

}

const PUT_REQUESTS: any = {
    '/addCard': async (req: Request, res: Response, options: HandlerOptions) => {

        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;

        let data = await getRequestData(req)
        let arr = JSON.parse(data)

        // if ()
        console.log(arr)
        if (!arr || !arr['front'] || !arr['back']) {
            res.writeHead(400)
            res.end()
            return
        }

        arr['front'] = arr['front'].trim()
        arr['back'] = arr['back'].trim()
        console.log("REQUEST ENDED!")

        let curSess = sm.getSessionFromRequest(req)
        let cardAdded;
        if (curSess)
            cardAdded = sm.addSessionCard(curSess, new Card(arr))

        res.writeHead((cardAdded) ? 200 : 400)
        console.log(cardAdded)
        if (cardAdded) {
            let data = JSON.stringify(sm.getSessionCards(curSess as string))
            res.write(data)
        }

        res.end()


    },

    '/editCard': async (req: Request, res: Response, options: HandlerOptions) => {

        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;

        let data = JSON.parse(await getRequestData(req))
        let curSess = sm.getSessionFromRequest(req)
        let cards = sm.getSessionCards(curSess as string)


        if (curSess && cards[data.id]) {
            let front: string = data.front
            let back: string = data.back

            if (front.trim().length != 0)
                cards[data.id].front = front
            if (back.trim().length != 0)
                cards[data.id].back = back

            sm.saveSessionCards(curSess, cards)

            let resData = JSON.stringify(sm.getSessionCards(curSess))
            res.writeHead(200)
            res.write(resData)
        } else {
            res.writeHead(400)
        }

        console.log("Sending request completion back to client.")
        res.end()
    },

    '/updateCard': async (req: Request, res: Response, options: HandlerOptions) => {

        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;
        let data = JSON.parse(await getRequestData(req))

        let curSess = sm.getSessionFromRequest(req)
        let cards = sm.getSessionCards(curSess as string)
        let newCard = new Card(data)
        if (curSess && cards[data.id] && newCard.isValid()) {
            cards[data.id] = new Card(data)
            res.writeHead(200)
            sm.saveSessionCards(curSess, cards)
        } else {
            res.writeHead(400)
        }

        console.log("Sending request completion back to client.")
        res.end()
    },


}

const DELETE_REQUESTS = {

    '/removeCard': async (req: Request, res: Response, options: HandlerOptions) => {

        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;

        let data = await getRequestData(req)
        let curSess = sm.getSessionFromRequest(req)
        let cards = sm.getSessionCards(curSess as string)
        if (curSess && cards[data]) {
            delete cards[data]
            sm.saveSessionCards(curSess, cards)
            res.writeHead(200)
        } else {
            res.writeHead(400)
        }

        console.log("Sending request completion back to client.")
        res.end()
    }
}

const POST_REQUESTS = {
    '/sync': async (req: Request, res: Response, options: HandlerOptions) => {
        if (!options.sm) throw "SessionManager not found"

        const sm: SessionManager = options.sm;

        let curSess = sm.getSessionFromRequest(req)
        
        
        if (!curSess) {
            res.writeHead(500);
            res.end()
        }

        let data = await getRequestData(req)
        
        const SYNC = SyncManager.getInstance()
        if (!SYNC.testSyncCode(data)) {
            res.writeHead(400)
            res.end()
            return
        }

        let newSess = SYNC.getSession(data) as string
        sm.transferSession(req, res, newSess)
        let cards = sm.getSessionCards(newSess)
        res.writeHead(200)
        res.write(JSON.stringify(cards))
        res.end()
        
    }
}

const REQUESTS: any = {
    "PUT": PUT_REQUESTS,
    "GET": GET_REQUESTS,
    "POST": POST_REQUESTS,
    "DELETE": DELETE_REQUESTS
}

async function getRequestData(request: Request): Promise<string> {
    return new Promise((resolve, reject) => {
        let datachunks: Array<Buffer> = [];
        request.on('data', (d: Buffer) => {
            datachunks.push(d)
        })

        request.on('end', () => {
            resolve(datachunks.join(''))
        })
    })
}


class HandlerOptions {
    // SessionManager object, session manager
    public sm?: SessionManager;


    constructor(options?: object) {
        if (options != undefined)
            Object.assign(this, options)
    }
}

export default RequestHandler;