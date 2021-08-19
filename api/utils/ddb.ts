const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1',
});



export class DDBHelper {

    TABLE_NAME = '';
    PrimaryKeyName = '';
    SecondaryKeyName = '';

    docClient = new AWS.DynamoDB.DocumentClient();

    constructor(helperOptions:{tableName:string, primaryKeyName:string, secondaryKeyName?:string}){
      const {tableName, primaryKeyName, secondaryKeyName} = helperOptions;
      this.TABLE_NAME = tableName;
      this.PrimaryKeyName = primaryKeyName;
      this.SecondaryKeyName = secondaryKeyName;
    }

    updateTableName(name:string) {
          this.TABLE_NAME= name;
    }

  getRelationFromKey(key: string, startIndex:number = 0): { name: string; id?: string } {
    if (key.includes('#')) {
      return {
        name: key.split('#')[startIndex],
        id: key.split('#')[startIndex+1],
      };
    }
    return { name: key };
  }

   generateLookupKey(
    primaryKeyValue: string,
    secondaryKeyValue?: string,
  ) {
    const {PrimaryKeyName, SecondaryKeyName} = this;
    const key = {};
    key[PrimaryKeyName] = primaryKeyValue;
    if (secondaryKeyValue) {
      key[SecondaryKeyName] = secondaryKeyValue;
    }

    return key;
  }

   async createItem(
    primaryKeyValue: string,
    data: any,
    secondaryKeyValue?: string,
    doNotCreateIfExists?: boolean,
  ) {

    const {PrimaryKeyName, SecondaryKeyName, TABLE_NAME, docClient} = this;
    const key = this.generateLookupKey(primaryKeyValue, secondaryKeyValue);

    const updateParams = {
      TableName: TABLE_NAME,
      Item: {
        ...key,
        ...data,
      },
    };

    if (doNotCreateIfExists) {
      let expression = `#p <> :pk`;

      const attributeNames = {
        '#p': PrimaryKeyName,
      };
      const attributeValues = {
        ':pk': primaryKeyValue,
      };

      if (secondaryKeyValue) {
        expression += ` AND #s <> :sk`;
        attributeNames['#s'] = SecondaryKeyName;
        attributeValues[':sk'] = secondaryKeyValue;
      }

      updateParams['ExpressionAttributeNames'] = attributeNames;
      updateParams['ConditionExpression'] = expression;
      updateParams['ExpressionAttributeValues'] = attributeValues;
    }

    try {
      await docClient.put(updateParams).promise();
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  /**
   * Deletes an item from the table
   * @param primaryKeyValue 
   * @param secondaryKeyValue 
   * @returns 
   */
  async deleteItem(
    primaryKeyValue: string,
    secondaryKeyValue?: string,
  ) {

    const {TABLE_NAME, docClient} = this;
    const key = this.generateLookupKey(primaryKeyValue, secondaryKeyValue);

    const deleteParams = {
      TableName: TABLE_NAME,
      Key:key
    };

    try {
      await docClient.delete(deleteParams).promise();
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  /**
   *
   * @param primaryKeyValue
   * @param colName
   * @param key
   * @param value
   * @param _doNotCreateColumn - Internal param. Do not use. Override column creation
   * Updates a map column value to hold a new key value pair, and creates if not exists
   */
   async setKeyInColumn(
    primaryKeyValue: string,
    colName: string,
    key: string,
    value: any,
    _doNotCreateColumn?: boolean,
  ) {
    const {docClient} = this;
    const obj = {};
    obj[key] = value;
    const {TABLE_NAME} = this;

    const ConditionExpression = _doNotCreateColumn
      ? undefined
      : `attribute_not_exists(${colName})`;
    const AttributeValue = _doNotCreateColumn ? value : obj;
    const UpdateExpression = _doNotCreateColumn
      ? `SET ${colName}.${key} = :keyval `
      : `SET ${colName} = :keyval `;
    try {
      const updateParams = {
        TableName: TABLE_NAME,
        Key: this.generateLookupKey(primaryKeyValue),
        UpdateExpression,
        ExpressionAttributeValues: {
          ':keyval': AttributeValue,
        },
        ConditionExpression,
        ReturnValues: 'ALL_NEW',
      };
      const resp = await docClient.update(updateParams).promise();

      if (resp && resp[colName]) {
        return resp[colName];
      }
    } catch (ex) {
      if (ex.code === 'ConditionalCheckFailedException') {
        return this.setKeyInColumn(primaryKeyValue, colName, key, value, true);
      }
      console.log('Failed to Update Column in DynamoDB');
      console.log(ex);
      return undefined;
    }
  }

    /**
   * Get all items that are related to a certain primary key
   * */
   async queryItemByKey<T>(
    primaryKeyValue: string,
    indexOpts?:{
      indexName: string,
      indexKeyName:string;
    }
    

  ): Promise<T[] | undefined> {
    const {docClient, TABLE_NAME, PrimaryKeyName} = this;
    
 
    const queryParams: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: '#p = :pk',
      ExpressionAttributeNames: {
        '#p': indexOpts?.indexKeyName || PrimaryKeyName,
      },
      ExpressionAttributeValues: {
        ':pk': primaryKeyValue,
      },
    };

    if(indexOpts){
      queryParams.IndexName = indexOpts.indexName;
    }


    try {
      const resp = await docClient.query(queryParams).promise();
      if (resp && resp.Items) {
        return resp.Items;
      }
      return undefined;
    } catch (ex) {
      console.log('Getting Item Failed');
      console.log(ex);
      return undefined;
    }
  }

  /**
   * Get an entire item from the database
   */
   async getItem<T>(primaryKeyValue: string, secondaryKeyValue?: string):Promise<T | undefined> {
    const {TABLE_NAME, docClient} = this;
    const getParams = {
      TableName: TABLE_NAME,
      Key: this.generateLookupKey(primaryKeyValue, secondaryKeyValue),
    };

    try {
      const resp = await docClient.get(getParams).promise();
      if (resp && resp.Item) {
        return resp.Item;
      }
      return undefined;
    } catch (ex) {
      console.log('Getting Item Failed');
      console.log(ex);
      return undefined;
    }
  }

  /**
   * Get a subkey from
   * */
   async getKeyFromColumn(
    primaryKeyValue: string,
    colName: string,
    key: string,
  ): Promise<any | undefined> {
    // get the value of the column,
    const item = await this.getItem(primaryKeyValue);
    if (item[colName] && item[colName][key]) {
      return item[colName][key];
    }

    return undefined;
  }

  /**
   * Use to set a sub property on an item
   * */
  async updateItemAttribute(
    primaryKeyValue: string,
    attributeName: string,
    value: any,
    secondaryKeyValue?: string,
    options?:{appendToList?:boolean}
  ): Promise<any | undefined> {
    const { TABLE_NAME, docClient} = this;
    let UpdateExpression =`SET ${attributeName} = :details`;

    if(options && options.appendToList){
      UpdateExpression = `SET ${attributeName} = list_append(${attributeName}, :details)`;
    }

    const updateParams = {
      TableName: TABLE_NAME,
      Key: this.generateLookupKey(primaryKeyValue, secondaryKeyValue),
      UpdateExpression,
      ExpressionAttributeValues: {
        ':details': value,
      },
      ReturnValues: 'ALL_NEW',
    };

    try {
      const resp = await docClient.update(updateParams).promise();
      if (resp && resp.Attributes) {
        return resp.Attributes;
      }
      return undefined;
    } catch (ex) {
      console.log('Updating Item Failed');
      console.log(ex);
      return undefined;
    }
  }

  /**
   * Use to delete a sub property on an item
   * */
   async deleteKeyInColumn(
    primaryKeyValue: string,
    colName: string,
    secondaryKeyValue?: string,
  ): Promise<boolean> {
    const {TABLE_NAME, docClient} = this;
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: this.generateLookupKey(primaryKeyValue, secondaryKeyValue),
      UpdateExpression: `REMOVE #c`,
      ExpressionAttributeNames: {
        '#c': colName,
      },
    };

    try {
      await docClient.update(deleteParams).promise();
      return true;
    } catch (ex) {
      console.log('Deleting Item Failed');
      console.log(ex);
      return false;
    }
  }
}
