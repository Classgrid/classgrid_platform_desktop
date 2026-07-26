const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://classgrid-admin:27iwqvVnbpqq6RD5@ac-hs4letd-shard-00-00.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-01.sa5ww0z.mongodb.net:27017,ac-hs4letd-shard-00-02.sa5ww0z.mongodb.net:27017/classgrid?ssl=true&replicaSet=atlas-t4g7k9-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Classgrid';

mongoose.connect(MONGO_URI).then(async () => {
  const noteSchema = new mongoose.Schema({}, { strict: false });
  const Note = mongoose.model('PersonalNote', noteSchema);
  const notes = await Note.find({ title: /Environmetal/i });
  for (const note of notes) {
    let content = note.get('content') || '';
    if (content.includes('<div>')) {
      content = content.replace(/<div>/g, '').replace(/<\/div>/g, '\n').replace(/<br\s*\/?>/gi, '\n');
    }
    if (!content.trim().startsWith('```')) {
      content = '```env\n' + content.trim() + '\n```';
    }
    note.set('content', content);
    note.set('textContent', content);
    await note.save();
    console.log('Fixed note:', note._id);
  }
  console.log('Done');
  process.exit(0);
}).catch(console.error);
