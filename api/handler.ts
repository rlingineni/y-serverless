import { APIGatewayProxyHandler } from "aws-lambda";
import YSockets from "./helpers/ysockets";



const AWS = require('aws-sdk');
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT
});

const getDocName = (event:any) => {
  const qs = event.multiValueQueryStringParameters

  if (!qs || !qs.doc) {
    throw new Error('must specify ?doc=DOC_NAME')
  }

  return qs.doc[0]
}

const send = async(id:string, message:any) =>{
  await apig.postToConnection({
    ConnectionId: id,
    Data: JSON.stringify(message)
  }).promise();
}

exports.handler = async function(event) {
  // For debug purposes only.
  // You should not log any sensitive information in production.
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const { body, requestContext: { connectionId, routeKey }} = event;
  const ysockets = new YSockets();

  switch(routeKey) {
    case '$connect':{
      const docName = getDocName(event)
      await ysockets.onConnection(connectionId, docName)
      return { statusCode: 200, body: 'Connected.' }
    } 
    case '$disconnect':{
      await ysockets.onDisconnect(connectionId)
      return { statusCode: 200, body: 'Disconnected.' }
    }
    case '$default':
    default:{
      console.log(event.body);
      const {message} = event.body;
      await ysockets.onMessage(connectionId, message, send )
    }
      
  }

  // Return a 200 status to tell API Gateway the message was processed
  // successfully.
  // Otherwise, API Gateway will return a 500 to the client.
  return { statusCode: 200 };
}
