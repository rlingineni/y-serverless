"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YSockets = void 0;
const connections_1 = require("./connections");
const syncProtocol = require("y-protocols/sync");
const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");
const buffer_1 = require("lib0/buffer");
const Y = require("yjs");
const getDocName = (event) => {
    const qs = event.multiValueQueryStringParameters;
    if (!qs || !qs.doc) {
        throw new Error('must specify ?doc=DOC_NAME');
    }
    return qs.doc[0];
};
const messageSync = 0;
const messageAwareness = 1;
class YSockets {
    constructor() {
        this.ct = new connections_1.ConnectionsTableHelper();
    }
    async onConnection(connectionId, docName) {
        const { ct } = this;
        await ct.createConnection(connectionId, docName);
        const doc = await ct.getOrCreateDoc(docName);
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeSyncStep1(encoder, doc);
        // TODO: cannot send message during connection.. Need to broadcast likely
        // await send({ context, message: encoding.toUint8Array(encoder), id })
        console.log(`${connectionId} connected`);
    }
    async onDisconnect(connectionId) {
        const { ct } = this;
        await ct.removeConnection(connectionId);
        console.log(`${connectionId} disconnected`);
    }
    async onMessage(connectionId, b64Message, send) {
        const { ct } = this;
        let messageArray = buffer_1.fromBase64(b64Message);
        const docName = (await ct.getConnection(connectionId)).DocName;
        const connectionIds = await ct.getConnectionIds(docName);
        const otherConnectionIds = connectionIds.filter(id => id !== connectionId);
        const broadcast = (message) => {
            return Promise.all(otherConnectionIds.map(id => {
                return send(id, buffer_1.toBase64(message));
            }));
        };
        const doc = await ct.getOrCreateDoc(docName);
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(messageArray);
        const messageType = decoding.readVarUint(decoder);
        switch (messageType) {
            // Case sync1: Read SyncStep1 message and reply with SyncStep2 (send doc to client wrt state vector input)
            // Case sync2 or yjsUpdate: Read and apply Structs and then DeleteStore to a y instance (append to db, send to all clients)
            case messageSync:
                encoding.writeVarUint(encoder, messageSync);
                // syncProtocol.readSyncMessage
                const messageType = decoding.readVarUint(decoder);
                switch (messageType) {
                    case syncProtocol.messageYjsSyncStep1:
                        syncProtocol.writeSyncStep2(encoder, doc, decoding.readVarUint8Array(decoder));
                        break;
                    case syncProtocol.messageYjsSyncStep2:
                    case syncProtocol.messageYjsUpdate:
                        const update = decoding.readVarUint8Array(decoder);
                        Y.applyUpdate(doc, update);
                        await ct.updateDoc(docName, buffer_1.toBase64(update));
                        await broadcast(messageArray);
                        break;
                    default:
                        throw new Error('Unknown message type');
                }
                if (encoding.length(encoder) > 1) {
                    await send(connectionId, buffer_1.toBase64(encoding.toUint8Array(encoder)));
                }
                break;
            case messageAwareness: {
                await broadcast(messageArray);
                break;
            }
        }
    }
}
exports.YSockets = YSockets;
exports.default = YSockets;
//# sourceMappingURL=ysockets.js.map