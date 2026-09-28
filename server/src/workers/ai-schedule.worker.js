import cron from 'node-cron';
import AiSchedule from '../models/AiSchedule.js';
import { sendEmail } from '../services/aws-ses.service.js';

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // Find pending schedules where scheduled time has passed
    const pendingSchedules = await AiSchedule.find({
      status: 'pending',
      scheduled_at: { $lte: now }
    });

    for (const schedule of pendingSchedules) {
      try {
        await sendEmail({
          to: schedule.user_email,
          subject: schedule.email_subject,
          html: schedule.email_body,
          fromEmail: 'agent@classgrid.in',
          fromName: 'Classgrid AI'
        });
        
        schedule.status = 'sent';
        schedule.sent_at = new Date();
        await schedule.save();
        console.log(`[AiSchedule Worker] Successfully sent schedule ${schedule._id} to ${schedule.user_email}`);
      } catch (err) {
        console.error(`[AiSchedule Worker] Failed to send schedule ${schedule._id}:`, err);
        schedule.status = 'failed';
        schedule.error_message = (err.message || "") + " | " + String(err) + (err.stack ? `\nStack: ${err.stack}` : "");
        await schedule.save();
      }
    }
  } catch (error) {
    console.error('[AiSchedule Worker] Error processing schedules:', error);
  }
});
