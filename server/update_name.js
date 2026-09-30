import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin')
  .then(async () => {
    const result = await mongoose.connection.collection('users').updateMany(
      { microsoft_email: /nikhilsun123/i },
      { $set: { microsoft_name: 'Nikhil Shinde' } }
    );
    console.log('Updated users:', result.modifiedCount);
    process.exit(0);
  })
  .catch(console.error);
