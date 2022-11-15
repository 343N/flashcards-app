import * as fs from "fs"
import * as path from "path"
import * as archiver from "archiver"
import SETTINGS from './settings'

const datapath = SETTINGS.dataPath

export function isStringEmpty(str: string){
    return (str.trim().length == 0)
}

export function generateRandomKey(len: number) {
    let str = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    // len = len + Math.floor((Math.random() - 0.5) * 10)
    let s = ""
    for (let i = 0; i < len; i++)
        s = s + str.charAt(Math.floor(Math.random() * str.length))

    return s;

}

export function createDataFolders() {
    if (!fs.existsSync(datapath))
        fs.mkdirSync(datapath)
}

export function backupDataFolders() {
    if (!fs.existsSync(SETTINGS.backupPath))
    fs.mkdirSync(SETTINGS.backupPath)
    if (fs.existsSync(datapath))
        console.log(`Backing up data folders! ${new Date().toString()}`)
        createZip(SETTINGS.backupPath, 'backup-' + new Date().getTime(), SETTINGS.dataPath)
}

export function createZip(dir: string, name: string, zipDir: string) {
    // console.log(`Backing up data folders! ${new Date().toString()}`)
    // console.log()
    if (!zipDir) throw "NO ZIP DIR!"
    if (!name) throw "NO SAVE DIR!"
    if (!dir) throw "NO ZIP NAME!"
    let output = fs.createWriteStream(path.join(dir, name + '.zip'))
    let archive = archiver.default('zip', {
        zlib: {
            level: 9
        }
    })
    
    archive.on('error', function(err: archiver.ArchiverError) {
        throw err;
    });
    archive.on('warning', function(err: archiver.ArchiverError) {
        if (err.code === 'ENOENT') {
            console.log(err)
        } else {
            // throw error
            throw err;
        }
    });

    archive.pipe(output)
    archive.directory(zipDir, false)
    archive.finalize()
}

