import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const AiSchedule = (await import('./server/src/models/AiSchedule.js')).default;
    const failedSchedules = await AiSchedule.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(3);
    for (const schedule of failedSchedules) {
      console.log(`\nSchedule ID: ${schedule._id}`);
      console.log(`Title: ${schedule.title}`);
      console.log(`Scheduled At: ${schedule.scheduled_at}`);
      console.log(`Error Message: ${schedule.error_message}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
