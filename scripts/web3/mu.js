"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkFile = checkFile;
exports.getDeckContent = getDeckContent;
exports.setFile = setFile;
exports.setThirdwebURI = setThirdwebURI;
exports.saveFile = saveFile;
const keys_1 = require("./keys");
const thirdWebClient_1 = require("./thirdWebClient");
const ROOT = "https://www.mariouniversalis.fr/brewing-disaster/";
let thirdWebURI = "";
let deckContent = "";
async function checkFile(fileId) {
    try {
        const response = await fetch(`${ROOT}${fileId}`, {
            method: "GET",
        });
        if (response.ok) {
            thirdWebURI = await response.text();
            if (thirdWebURI) {
                try {
                    deckContent = await (0, thirdWebClient_1.downloadFile)(thirdWebURI);
                }
                catch (e) {
                    thirdWebURI = "";
                    deckContent = "";
                    return true;
                }
            }
            return true;
        }
        return false;
    }
    catch (error) {
        return false;
    }
}
function getDeckContent() {
    return deckContent;
}
async function setFile(fileId, content) {
    try {
        const response = await fetch(`${ROOT}${fileId}`, {
            method: "PUT",
            body: content,
            headers: {
                "Content-Type": "text/plain",
            },
        });
        if (!response.ok) {
            throw new Error("Error while updating file");
        }
    }
    catch (error) {
        throw error;
    }
}
async function setThirdwebURI(uri, publicKey) {
    thirdWebURI = uri;
    await setFile(publicKey, uri);
    return uri;
}
async function saveFile(fileContent) {
    const newFileContent = fileContent.join("\n");
    const newFileURI = await (0, thirdWebClient_1.uploadFile)(newFileContent);
    deckContent = newFileContent;
    if (thirdWebURI) {
        try {
            await (0, thirdWebClient_1.deleteFile)(thirdWebURI);
        }
        catch (e) { }
    }
    const publicKey = await (0, keys_1.getPublicKey)();
    await setThirdwebURI(newFileURI, publicKey);
}
