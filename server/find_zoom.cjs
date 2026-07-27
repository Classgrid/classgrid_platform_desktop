const mongoose = require('mongoose');
mongoose.connect('mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid')
.then(async () => { 
    try { 
        const User = (await import('./src/models/User.js')).default; 
        const users = await User.find({ zoom_access_token: { $exists: true, $ne: null } }); 
        console.log('Users with Zoom token:', users.length); 
        if (users.length > 0) { 
            console.log('Email:', users[0].email); 
            console.log('Token Expiry:', users[0].zoom_token_expiry);
            console.log('Token:', users[0].zoom_access_token.substring(0, 20) + '...');
        } 
    } catch (e) { 
        console.error(e); 
    } 
    process.exit(0); 
});
