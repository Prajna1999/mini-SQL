const _ =require('lodash');
const fs = require('fs').promises;
const {v4:uuidv4}=require('uuid');

class Table{
  constructor(name, columns, filepath){
    this.name=name;
    this.columns=columns;
    this.rows=new Map();
    this.transactions=[];
    this.filepath=filepath;
    this.transactionActive=false;
  }

  insert(row){

    if(typeof row!=='object'){
      throw new Error('Inserted row must be an object');
    }
    
    const id=uuidv4();
    const validateRow=_.pick(row, this.columns);
    
    if(Object.keys(validateRow).length!==this.columns.length){
      throw new Error('Inserted row does not match table columns');
    }
    
    if (this.transactionActive) {
        this.transactions.push({ type: 'insert', id, data: validateRow });
    } else {
        this.rows.set(id, validateRow);
    }
    
    return id;
  }

  select(id){
    if(!this.rows.has(id)){
      throw new Error('Cannot delete a row that does not exist');
    }
    return this.rows.get(id);
  }

  update(id, newRow){
   if(!this.rows.has(id)){
     throw new Error('Cannot update a row that does not exist');
   }

    if(typeof newRow!=='object'){
      throw new Error('Updated row must be an object');
    }
    const validatedRow=_.pick(newRow, this.columns);

    if(Object.keys(validatedRow).length!==this.columns.length){
      throw new Error('Updated row does not match table columns');
    }

    if (this.transactionActive) {
        this.transactions.push({ type: 'update', id, data: validatedRow });
    } else {
        this.rows.set(id, validatedRow);
    }
    
    return id;
  }

  delete(id){
   if(!this.rows.has(id)){
     throw new Error('Cannot delete a row that does not exist');
   }
    if (this.transactionActive) {
        this.transactions.push({ type: 'delete', id });
    } else {
        this.rows.delete(id);
    }

    return id;
  }

  selectAll(){
    return Array.from(this.rows.values());
  }

  selectWhere(callback){
    return this.selectAll().filter(callback);
  }
  
  sort(callback){
    return this.selectAll().sort(callback);
  }
  
  join(otherTable, thisColumn, otherColumn){
    const joinedRows=[];
    const otherTableRowsByColumn=new Map();

    // map the values of the otherColumn in the 'otherTable' to the corresponding rows
    otherTable.rows.forEach((otherRow, otherRowId)=>{
      const key=otherRow[otherColumn];

      if(otherTableRowsByColumn.has(key)){
        otherTableRowsByColumn.get(key).push(otherRow)
      }else{
        otherTableRowsByColumn.set(key, [otherRow]);
      }
    });
//for easch row in this table, find matching rows in other table and merger them.
    this.rows.forEach((thisRow, thisRowId)=>{
      const key=thisRow[thisColumn];
      if(otherTableRowsByColumn.has(key)){
        otherTableRowsByColumn.get(key).forEach((otherRow)=>{
          joinedRows.push({
            ...thisRow,
            ...otherRow
          });
        })
      }
    })
  }

  groupBy(column){
    const groups=_.groupBy(Array.from(this.rows.values()), row=>row[column]);
     return Object.entries(groups).map(([key, values]) => ({key, values}));
  }

  // transaction methods
  async beginTransaction(){
    //saving a copy of the current state of the table
    this.transactionActive=true;
    try{
      await this.loadFromDisk();
    }catch(error){
      console.error(`Failed to load data from disk: ${error}`);
    }
  }
  //commit end the transaction
  async commit(){
    //end the transaction
    if(this.transactionActive){
      this.transactions.forEach(txn=>{
        if(txn.type='insert' || txn.type==='update'){
          this.rows.set(txn.id, txn.data)
        
        }else if(txn.type==='delete'){
          
            this.rows.delete(txn.id)
          
        }
      });

      // reset the txn state
      //save the txns to the disk
      this.transactions=[];
      this.transactionActive=false;

      try{
        await this.saveToDisk();
        
      }catch(error){
        console.error(`Failed to load data from disk: ${error}`);
      }
    }
    
  }
  //rollback if the txn is failed
  rollback(){
    if(this.transactionActive){
      this.trasactions=[];
      this.transactionActive=false;
    }
  }

  // add data persistence layer
  //save a table to the disk
  async saveToDisk(){
    //serialize the data and save to a file
    if(this.rows.length>0){
      const rowsArray=Array.from(this.rows.entries());
    const data=JSON.stringify(rowsArray);
    await fs.writeFile(this.filePath, data);
    }
    
  }
  //load data from the disk
  async loadFromDisk(){
   try {
            const data = await fs.readFile(this.filePath);
            if (data) {
                const rowsArray = JSON.parse(data);
                this.rows = new Map(rowsArray);
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                // Re-throw any other errors
                throw error;
            }
        }
  }
}

module.exports=Table;