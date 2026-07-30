const mongoose = require('mongoose');

const uri = 'mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid';

mongoose.connect(uri)
  .then(async () => {
    const orgs = mongoose.connection.collection('organizations');
    await orgs.updateMany({}, {
      $set: {
        'billing_settings.invoice_email': 'nehasharmaking25@gmail.com',
        'billing_settings.email_verified': true
      }
    });
    console.log('Restored email successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
