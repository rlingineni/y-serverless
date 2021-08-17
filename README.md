# y-serverless

 Serverless Provider using Websockets and DynamoDB for YJS. Easy deploy. Written in typescript.

 Huge shout out to [gaberogan](https://github.com/gaberogan/y-websocket-api/) original repo. 

 Open limitations:

 1. Doesn't work with regular `y-websockets`. AWS sockets requires base64 strings. You need a modifided sockets provider from the client repo to pass b64 strings

 2. Not optimized yet, so may create more clients and data than necessary


 ## Setup

 ### Testing Locally
 ```
npm install
npm run start
 ```

 Spins up a local server on `ws://localhost:5000`

### Deploy to AWS
```
serverless deploy
```

### Resources
Creates a DynamoDB table to maintain documents and connection information.