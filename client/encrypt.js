

/**
 * Description placeholder
 * @date 06/03/2024 - 5:58:19 pm
 *
 * @param {*} bits
 * @returns {{ key: new Uint8Array; iv: new Uint8Array; }}
 */
function generateEncryptionKey(bits){
    c = 256
    switch(bits){
        case 128:
            c = 128
            break
        case 192:
            c = 192
    }  

    let nbytes = (c/8)
    let keydata = new Uint8Array(nbytes + 16)
    keydata = new Crypto().getRandomValues(keydata)

    return {
        "key": keydata.slice(0, nbytes),
        "iv": keydata.slice(nbytes, nbytes + 8)
    }    

}



function resetEncryptionKey(bits=256){
    let d = generateEncryptionKey()
    localStorage.setItem("key", btoa(d.key))
    localStorage.setItem("iv", btoa(d.iv))
}

/**
 * Description placeholder
 * @date 06/03/2024 - 6:05:33 pm
 *
 * @returns {Uint8Array}
 */
function getKey(){
    if (!localStorage.getItem("key")) {
        resetEncryptionKey()
    
    let vals = localStorage.getItem("key") 
    return new Uint8Array(vals)
}

function getIv(){
    if (!localStorage.getItem("iv")) {
        resetEncryptionKey()
        
    let vals = localStorage.getItem("key") 
    return new Uint8Array(vals)
}


/**
 * Encrypts data given using a key and IV, either provided or pre-generated
 * @date 06/03/2024 - 6:08:55 pm
 *
 * @param {Uint8Array} key Key to use for encryption. If omitted, a new one will be generated (and stored)
 * @param {Uint8Array} [iv=null] IV to use with the key. Must be present if key is present 
 * @param {*} [data=null] Data to be encrypted
 * @returns {string} Base64-encoded string
 */
function encrypt(key, iv=null, data=null)
if (!iv && !data){
    // TODO
}

/**
 * Decrypts data given using a key and IV, either provided or pre-generated
 * @date 06/03/2024 - 6:08:55 pm
 *
 * @param {Uint8Array} key Key to use for decryption. If omitted, the auto-generated/stored key will be used
 * @param {Uint8Array} [iv=null] IV to use with the key. Must be present as an argument if key is present 
 * @param {*} [data=null] Base64-encoded data to be dencrypted
 * @returns {string} Decoded string
 */
function decrypt(key, iv, data){
    // TODO
}