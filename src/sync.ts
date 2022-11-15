import { randomInt } from "crypto";
import BiMap from "./bimap";
import SETTINGS from "./settings";

const CODE_LIFETIME = SETTINGS.syncCodeLifetimeHrs

export class SyncManager {

    private static instance: SyncManager;

    private constructor() { }

    public static getInstance() {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }

        return SyncManager.instance;
    }

    // maps a session to SyncData
    private sessionSyncData = new Map<string, SyncData>()
    // bidirectional map between session and sync code
    private sessionSyncIndex = new BiMap<string, string>()

    // solely generates a sync code
    generateSyncCode(): string {
        const DIGITS = 6
        let code = randomInt(10 ** (DIGITS - 1), (10 ** DIGITS) - 1).toString()
        while (this.testSyncCode(code))
            code = randomInt(10 ** (DIGITS - 1), (10 ** DIGITS) - 1).toString()


        return code;
    }

    createSyncSession(session: string): SyncData {
        if (this.hasValidSyncCode(session)) 
            return this.sessionSyncData.get(session) as SyncData
        this.sessionSyncIndex.deleteKey(session)
        let code = this.generateSyncCode()
        let syncData = { session: session, code: code, date_created: new Date() }
        this.sessionSyncIndex.set(session, code)
        this.sessionSyncData.set(session, syncData)
        return syncData;
    }

    getSyncDataFromSession(session: string): SyncData | undefined {
        return this.sessionSyncData.get(session)
    }

    getSyncDataFromCode(code: string): SyncData | undefined {
        return this.sessionSyncData.get(this.sessionSyncIndex.key(code) as string)
    }

    getSession(code: string): string | undefined {
        return this.sessionSyncIndex.key(code)
    }

    getCode(session: string): string | undefined {
        if (this.hasValidSyncCode(session))
            return this.sessionSyncIndex.value(session)
        return undefined
    }

    

    hasValidSyncCode(session: string): boolean {
        let syncData = this.sessionSyncData.get(session)
        if (!syncData) return false;

        return this.syncExpired(syncData)
    }

    testSyncCode(testCode: string): boolean {

        let session = this.sessionSyncIndex.key(testCode)
        if (!session) return false;
        let syncData = this.sessionSyncData.get(session)
        if (!syncData) return false;

        return this.syncExpired(syncData)

    }

    syncExpired(data: SyncData): boolean {

        let created_millis = data.date_created.getTime()
        let threshold = created_millis + (CODE_LIFETIME * 60 * 60 * 1000)
        return threshold > new Date().getTime()
    }

}

export interface SyncData {
    session: string,
    code: string
    date_created: Date
}
