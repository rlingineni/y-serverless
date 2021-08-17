import * as Y from 'yjs';
interface ConnectionItem {
    PartitionKey: string;
    DocName: string;
    data?: any;
    ttl: number;
}
export declare class ConnectionsTableHelper {
    private DatabaseHelper;
    constructor();
    createConnection(id: string, docName: string): Promise<boolean>;
    getConnection(id: string): Promise<ConnectionItem | undefined>;
    removeConnection(id: string): Promise<boolean>;
    getConnectionIds(docName: string): Promise<string[]>;
    getOrCreateDoc(docName: string): Promise<Y.Doc>;
    updateDoc(docName: string, update: string): Promise<any>;
}
export {};
