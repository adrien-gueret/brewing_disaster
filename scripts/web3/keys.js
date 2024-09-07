"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPrivateKey = void 0;
exports.getPublicKey = getPublicKey;
exports.generateNewPrivateKey = generateNewPrivateKey;
exports.default = init;
const save_1 = require("../save");
let privateKey;
let publicKey;
async function hash(text) {
    const res = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(res)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
}
async function getPublicKey() {
    if (publicKey) {
        return publicKey;
    }
    if (!privateKey) {
        return null;
    }
    publicKey = await hash(privateKey);
    return publicKey;
}
const setPrivateKey = async (newKey) => {
    (0, save_1.storeKey)("privateKey", newKey);
    privateKey = newKey;
    if (!privateKey) {
        publicKey = null;
    }
    else {
        await getPublicKey();
    }
    return privateKey;
};
exports.setPrivateKey = setPrivateKey;
async function generateNewPrivateKey() {
    const newPrivateKey = crypto.randomUUID();
    return await (0, exports.setPrivateKey)(newPrivateKey);
}
async function init() {
    return (0, exports.setPrivateKey)((0, save_1.getKey)("privateKey"));
}
