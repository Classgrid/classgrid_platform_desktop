import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './src/models/User.js';

async function test() {
  await connectDB();
  const user = await User.findOne({ email: 'nikhilsubsun123@gmail.com' });
  if (!user || !user.microsoft_access_token) {
    console.log('No token');
    return;
  }
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + user.microsoft_access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: 'Test Meeting via Script',
      start: { dateTime: '2026-09-20T14:00:00', timeZone: 'UTC' },
      end: { dateTime: '2026-09-20T15:00:00', timeZone: 'UTC' },
      isOnlineMeeting: true
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
test();
