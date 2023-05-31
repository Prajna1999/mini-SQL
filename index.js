
const Table=require('./src/models/Table');

const path = require('node:path');
const PATH=path.basename('users.json')
console.log(PATH)

const users=new Table('users', ['name', 'email'],PATH);
const id1=users.insert({name:'Alice', email:'alice@example.com'});
const id2=users.insert({name:'Bob', email:'bob@example.com'});

// console.log(id2)


users.beginTransaction();
const id3 = users.insert({ name: 'Charlie', email: 'charlie@example.com' });
users.update(id1, { name: 'Alice', email: 'alice@otherdomain.com' });
users.delete(id2);
users.commit();

