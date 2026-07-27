const mongoose = require('mongoose');

mongoose.connect('mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid')
.then(async () => {
    try {
        const DemoRequest = (await import('./src/models/DemoRequest.js')).default;
        const reqs = await DemoRequest.find({ institutionName: { $regex: /pccoe/i } });
        console.log(JSON.stringify(reqs, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
