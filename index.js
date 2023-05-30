const Table=require('./src/models/Table');


const users=new Table('users', ['name', 'email'],'./users.json');
const id1=users.insert({name:'Alice', email:'alice@example.com'});
const id2=users.insert({name:'Bob', email:'bob@example.com'});

const row=users.select(id2);
console.log(row)