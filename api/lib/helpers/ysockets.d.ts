export declare class YSockets {
    private ct;
    onConnection(connectionId: string, docName: string): Promise<void>;
    onDisconnect(connectionId: string): Promise<void>;
    onMessage(connectionId: string, b64Message: string, send: (id: string, b64Message: string) => Promise<void>): Promise<void>;
}
export default YSockets;
