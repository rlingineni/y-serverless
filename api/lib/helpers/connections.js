"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsTableHelper = void 0;
const ddb_1 = require("../utils/ddb");
const Y = require("yjs");
class ConnectionsTableHelper {
    constructor() {
        this.DatabaseHelper = new ddb_1.DDBHelper({ tableName: 'YConnectionsTable', primaryKeyName: 'PartitionKey' });
    }
    async createConnection(id, docName) {
        return this.DatabaseHelper.createItem(id, { DocName: docName, ttl: (Date.now() / 1000) + 3600 });
    }
    async getConnection(id) {
        const connections = await this.DatabaseHelper.queryItemByKey(id);
        if (connections && connections.length > 0) {
            return connections[0];
        }
        if (!connections || connections.length === 0) {
            await this.removeConnection(id);
            throw undefined;
        }
        return undefined;
    }
    async removeConnection(id) {
        return await this.DatabaseHelper.deleteItem(id);
    }
    async getConnectionIds(docName) {
        const results = await this.DatabaseHelper.queryItemByKey(docName, { indexKeyName: 'DocName', indexName: 'DocNameIndex' });
        if (results)
            return results.map(item => item.PartitionKey);
        return [];
    }
    async getOrCreateDoc(docName) {
        const existingDoc = await this.DatabaseHelper.getItem(docName);
        let dbDoc = {
            Updates: []
        };
        if (existingDoc) {
            dbDoc = existingDoc;
        }
        else {
            await this.DatabaseHelper.createItem(docName, dbDoc, undefined, true);
        }
        // convert update string to an encoded array
        const updates = dbDoc.Updates.map(update => new Uint8Array(Buffer.from(update, 'base64')));
        const ydoc = new Y.Doc();
        for (const update of updates) {
            try {
                Y.applyUpdate(ydoc, update);
            }
            catch (ex) {
                console.log("Something went wrong with applying the update");
            }
        }
        return ydoc;
    }
    async updateDoc(docName, update) {
        console.log(update);
        return await this.DatabaseHelper.updateItemAttribute(docName, 'Updates', [update], undefined, { appendToList: true });
    }
}
exports.ConnectionsTableHelper = ConnectionsTableHelper;
//# sourceMappingURL=connections.js.map