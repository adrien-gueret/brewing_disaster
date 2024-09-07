"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.deleteFile = deleteFile;
exports.default = init;
const thirdweb_1 = require("thirdweb");
const storage_1 = require("thirdweb/storage");
let thirdwebClient;
async function uploadFile(content) {
    return await (0, storage_1.upload)({
        client: thirdwebClient,
        files: [new File([content], "d.txt")],
    });
}
async function downloadFile(uri) {
    const file = await (0, storage_1.download)({
        client: thirdwebClient,
        uri,
    });
    return await file.text();
}
function deleteFile(uri) {
    return (0, storage_1.unpin)({
        client: thirdwebClient,
        cid: uri.match(/ipfs:\/\/([^\/]+)/)[1],
    });
}
async function init(secretKey) {
    thirdwebClient = (0, thirdweb_1.createThirdwebClient)({
        secretKey,
    });
}
