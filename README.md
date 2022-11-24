# Flashcards App - https://flashcards.343n.co/
A Node web server and client built in TypeScript, that lets users create flashcards and test themselves at intervals akin to [Spaced Repetition learning](https://en.wikipedia.org/wiki/Spaced_repetition). The flashcards are stored on the server, and users can sync their data across devices without needing an account, using a sync code.

I made this in 2020, but I migrated to TypeScript and added cross-device syncing when I created this repository. It's currently in the process of being prettied up and cleaned, mainly on the front-end.

## Settings
Settings are located in `src/settings.ts`

| Setting | Description |
| ----- | ----- |
| serverPort | Port that the web-server runs on|
|tokenLength| The size of user-tokens|
|dataPath| Where data is stored|
|backupPath| Where backups of the data directory are stored|
|backupIntervalsHrs| How often backups will be created, in hours|
|syncCodeLifetimeHrs| How long a sync code should be valid, in hours|

Settings can also be set on the command-line, using the setting name as a command line argument. For example, running
```
node . --serverPort 8080
``` 
on the command-line, will override the server port, setting it to 8080.

## Compiling and Running
Run `npm install` to retrieve dependencies, and `npm run build` to create a packed, non-minified file `app-bundle.js`.

Run with `node .` or `npm run`

## Security
This is not built to hold sensitive personal information. Users are authenticated by a token and that token *only*. There will be no implementation of user-authentication or an account system until further notice.

The `client` directory acts as a static hosting directory. Everything in `client` is exposed to the web.

Do not store anything in there, or set the data directory settings to be inside of that directory.
