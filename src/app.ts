import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path'
import * as mime from 'mime-types';
import * as cookie from 'cookie';
import * as archiver from 'archiver';
import * as util from "./util";
import Card from './card';
import SETTINGS from './settings';
import RequestHandler from './requests';
import SessionManager from './session';
import { Session } from 'inspector';

const SERVERPORT = SETTINGS.serverPort
const tokenLength = SETTINGS.tokenLength
const datapath = SETTINGS.dataPath
const userdatapath = datapath + 'userdata/'



const RH = RequestHandler.getInstance(SessionManager.getInstance())
util.createDataFolders()

const server = http.createServer((req, res) => {
    RH.handleRequest(req, res);
});
server.listen(SERVERPORT);


util.backupDataFolders()
setInterval(() => {
    util.backupDataFolders()
}, SETTINGS.backupIntervalHrs * 1000 * 60 * 60)


process.on('SIGINT', function() {
    console.log("Terminate detected, backing up data..");
    util.backupDataFolders()
    console.log("Exiting.")
    process.exit()
    
});