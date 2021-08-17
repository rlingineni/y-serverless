export declare class DDBHelper {
    TABLE_NAME: string;
    PrimaryKeyName: string;
    SecondaryKeyName: string;
    docClient: any;
    constructor(helperOptions: {
        tableName: string;
        primaryKeyName: string;
        secondaryKeyName?: string;
    });
    updateTableName(name: string): void;
    getRelationFromKey(key: string, startIndex?: number): {
        name: string;
        id?: string;
    };
    generateLookupKey(primaryKeyValue: string, secondaryKeyValue?: string): {};
    createItem(primaryKeyValue: string, data: any, secondaryKeyValue?: string, doNotCreateIfExists?: boolean): Promise<boolean>;
    /**
     * Deletes an item from the table
     * @param primaryKeyValue
     * @param secondaryKeyValue
     * @returns
     */
    deleteItem(primaryKeyValue: string, secondaryKeyValue?: string): Promise<boolean>;
    /**
     *
     * @param primaryKeyValue
     * @param colName
     * @param key
     * @param value
     * @param _doNotCreateColumn - Internal param. Do not use. Override column creation
     * Updates a map column value to hold a new key value pair, and creates if not exists
     */
    setKeyInColumn(primaryKeyValue: string, colName: string, key: string, value: any, _doNotCreateColumn?: boolean): any;
    /**
   * Get all items that are related to a certain primary key
   * */
    queryItemByKey<T>(primaryKeyValue: string, indexOpts?: {
        indexName: string;
        indexKeyName: string;
    }): Promise<T[] | undefined>;
    /**
     * Get an entire item from the database
     */
    getItem<T>(primaryKeyValue: string, secondaryKeyValue?: string): Promise<T | undefined>;
    /**
     * Get a subkey from
     * */
    getKeyFromColumn(primaryKeyValue: string, colName: string, key: string): Promise<any | undefined>;
    /**
     * Use to set a sub property on an item
     * */
    updateItemAttribute(primaryKeyValue: string, attributeName: string, value: any, secondaryKeyValue?: string, options?: {
        appendToList?: boolean;
    }): Promise<any | undefined>;
    /**
     * Use to delete a sub property on an item
     * */
    deleteKeyInColumn(primaryKeyValue: string, colName: string, secondaryKeyValue?: string): Promise<boolean>;
}
