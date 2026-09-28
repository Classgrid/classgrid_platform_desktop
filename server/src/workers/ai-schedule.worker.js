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
        // As requested by user: Trust MongoDB. Mark as sent immediately BEFORE AWS SES even tries.
        schedule.status = 'sent';
        schedule.sent_at = new Date();
        schedule.error_message = ''; 
        await schedule.save();
        
        console.log(`[AiSchedule Worker] Successfully marked schedule ${schedule._id} as sent for ${schedule.user_email}`);

        try {
          const { getIO } = await import('../services/socket.service.js');
          if (schedule.user_id) getIO().to(schedule.user_id.toString()).emit('ai:schedule_updated', { schedule_id: schedule._id });
        } catch (socErr) {
          console.error("Failed to emit socket update", socErr);
        }

        // Fire and forget AWS SES. Do NOT await it, and do NOT let its failures affect MongoDB.
        sendEmail({
          to: schedule.user_email,
          subject: schedule.email_subject,
          html: schedule.email_body
        }).catch(smtpErr => {
          console.warn(`[AiSchedule Worker] AWS SES SMTP threw an error, but it was already marked as sent in DB. Error: ${smtpErr.message}`);
        });
    }
  } catch (error) {
    console.error('[AiSchedule Worker] Error processing schedules:', error);
  }
});
