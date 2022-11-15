
// Modify settings here..
const SETTINGS: any = {
        "serverPort": 80,
        "tokenLength": 50,
        "dataPath": "data/",
        "backupPath": "backup/",
        "backupIntervalHrs": 3,
        "syncCodeLifetimeHrs": 12
}
// 

const minimist = require('minimist')

const args = minimist(process.argv.slice(2))
for (let a of Object.keys(args)) 
        if (a in SETTINGS) 
            SETTINGS[a] = args[a];
        
export default SETTINGS;
