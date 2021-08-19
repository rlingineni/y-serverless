import { DDBHelper } from "../utils/ddb";
import * as Y from "yjs";

import { toBase64 } from "lib0/buffer";

interface ConnectionItem {
  PartitionKey: string;
  DocName: string;
  data?: any;
  ttl: number;
}

interface DocumentItem {
  PartitionKey: string;
  Updates: { S: string }[];
}

export class ConnectionsTableHelper {
  private DatabaseHelper: DDBHelper;
  constructor() {
    this.DatabaseHelper = new DDBHelper({
      tableName: "YConnectionsTable",
      primaryKeyName: "PartitionKey",
    });
  }

  async createConnection(id: string, docName: string) {
    return this.DatabaseHelper.createItem(id, {
      DocName: docName,
      ttl: Date.now() / 1000 + 3600,
    });
  }

  async getConnection(id: string): Promise<ConnectionItem | undefined> {
    const connections =
      await this.DatabaseHelper.queryItemByKey<ConnectionItem>(id);

    if (connections && connections.length > 0) {
      return connections[0];
    }

    if (!connections || connections.length === 0) {
      await this.removeConnection(id);
      throw undefined;
    }

    return undefined;
  }

  async removeConnection(id: string): Promise<boolean> {
    return await this.DatabaseHelper.deleteItem(id);
  }

  async getConnectionIds(docName: string): Promise<string[]> {
    const results = await this.DatabaseHelper.queryItemByKey<ConnectionItem>(
      docName,
      { indexKeyName: "DocName", indexName: "DocNameIndex" }
    );
    if (results) return results.map((item) => item.PartitionKey);

    return [];
  }

  async getOrCreateDoc(docName: string): Promise<Y.Doc> {
    const existingDoc = await this.DatabaseHelper.getItem<DocumentItem>(
      docName
    );

    let dbDoc = {
      Updates: [],
    };
    if (existingDoc) {
      dbDoc = existingDoc;
    } else {
      await this.DatabaseHelper.createItem(docName, dbDoc, undefined, true);
    }

    // convert updates to an encoded array
    const updates = dbDoc.Updates.map(
      (update) => new Uint8Array(Buffer.from(update, "base64"))
    );

    const ydoc = new Y.Doc();
    for (const update of updates) {
      try {
        Y.applyUpdate(ydoc, update);
      } catch (ex) {
        console.log("Something went wrong with applying the update");
      }
    }

    return ydoc;
  }

  async updateDoc(docName: string, update: string) {
    console.log(update);
    return await this.DatabaseHelper.updateItemAttribute(
      docName,
      "Updates",
      [update],
      undefined,
      { appendToList: true }
    );

    /*
    Future: Try to compute diffs as one large update
    
    const existingDoc = await this.DatabaseHelper.getItem<DocumentItem>(docName);

        let dbDoc = {
            Updates: []
        }
        if(existingDoc) {
            dbDoc = existingDoc
        }else{
            await this.DatabaseHelper.createItem(docName, dbDoc, undefined, true)
        }

        const oldUpdates = dbDoc.Updates.map(update => new Uint8Array(Buffer.from(update, 'base64')))

        // merge updates into one large update
        const mergedUpdate = Y.mergeUpdates(oldUpdates.concat([update]));

        return await this.DatabaseHelper.updateItemAttribute(docName,'Updates', [toBase64(mergedUpdate)], undefined)*/
  }
}
