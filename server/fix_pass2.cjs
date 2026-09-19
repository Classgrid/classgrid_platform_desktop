const { MongoClient, ObjectId } = require('mongodb'); 
async function fix() { 
  const client = new MongoClient('mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin'); 
  await client.connect(); 
  const db = client.db(); 
  const res = await db.collection('User').updateOne(
    { email: 'nikhilsubsun321@gmail.com' }, 
    { $set: { password: '$2b$10$WkBerm2VyQmx7nhv7PfiEOug637wLX4JZbA.7IoLkV0ASAPGbcYNa' } }
  ); 
  console.log('Fix result:', res); 
  await client.close(); 
} 
fix().catch(console.error);
