import { APIGatewayProxyHandler } from "aws-lambda";
import YSockets from "./helpers/ysockets";



const AWS = require('aws-sdk');
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT
});

const getDocName = (event:any) => {
  const qs:any = event.multiValueQueryStringParameters

  // convert to array
    // if value starts with "doc-" use the docname
  const values = Object.values(qs) as string[][];
    for(const val of values){
      if(val[0].startsWith('doc-')){
        return val[0];
      }
    }
    
  
  
  if (!qs || !qs.doc) {
    throw new Error('Client must specify doc name in parameter')
  }


}

const send = async(id:string, message:string) =>{
  await apig.postToConnection({
    ConnectionId: id,
    Data: message
  }).promise();
}

exports.handler = async(event, context) =>  {
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
    default:
      await ysockets.onMessage(connectionId, body, send )
      return { statusCode: 200, body: 'Data Sent' };
    
  }
}
