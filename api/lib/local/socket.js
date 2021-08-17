"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const ysockets_1 = require("../helpers/ysockets");
const wss = new WebSocket.Server({ port: 5000 });
const ySockets = new ysockets_1.default();
const connectedClients = [];
wss.on('connection', ws => {
    const sendToClient = (id, message) => {
        //
        console.log("Broadcast Message Everywhere ... ");
    };
    ws.on('message', evt => {
        console.log(evt);
        const message = evt.toString();
        console.log(message);
        console.log(`Received message => ${message}`);
    });
    console.log(ws);
    connectedClients.push(ws);
    ws.send('A client connected tothe  Server!');
});
wss.on('close', ws => {
    ws.send('Disconnected from Server');
});
console.log("Listening on ws://localhost:5000");
exports.default = wss;
//# sourceMappingURL=socket.js.map