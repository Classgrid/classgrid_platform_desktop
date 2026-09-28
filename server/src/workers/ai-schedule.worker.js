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
        let emailError = null;
        try {
          await sendEmail({
            to: schedule.user_email,
            subject: schedule.email_subject,
            html: schedule.email_body
          });
        } catch (smtpErr) {
          console.warn(`[AiSchedule Worker] AWS SES SMTP threw an error for ${schedule._id}, but email might have sent. Error: ${smtpErr.message}`);
          emailError = smtpErr;
        }
        
        // Even if SMTP threw a timeout or rate-limit error, we mark as sent if it's likely a false negative, 
        // or if you want strict failure, we mark as failed. Let's mark as sent but save the warning, 
        // or mark as failed if it's a hard bounce. For now, let's be safe: if it's a timeout/network error, 
        // we'll assume it sent, otherwise failed.
        if (emailError) {
           schedule.status = 'failed';
           schedule.error_message = `AWS SES Error: ${emailError.message}`;
        } else {
           schedule.status = 'sent';
           schedule.sent_at = new Date();
           schedule.error_message = ''; // clear any old errors
        }

        await schedule.save();
        
        if (!emailError) {
          console.log(`[AiSchedule Worker] Successfully sent schedule ${schedule._id} to ${schedule.user_email}`);
        }

        try {
          const { getIO } = await import('../services/socket.service.js');
          if (schedule.user_id) getIO().to(schedule.user_id.toString()).emit('ai:schedule_updated', { schedule_id: schedule._id });
        } catch (socErr) {
          console.error("Failed to emit socket update", socErr);
        }
      } catch (err) {
        console.error(`[AiSchedule Worker] Failed to send schedule ${schedule._id}:`, err);
        schedule.status = 'failed';
        schedule.error_message = (err.message || "") + " | " + String(err) + (err.stack ? `\nStack: ${err.stack}` : "");
        await schedule.save();
        
        try {
          const { getIO } = await import('../services/socket.service.js');
          if (schedule.user_id) getIO().to(schedule.user_id.toString()).emit('ai:schedule_updated', { schedule_id: schedule._id });
        } catch (socErr) {
          console.error("Failed to emit socket update", socErr);
        }
      }
    }
  } catch (error) {
    console.error('[AiSchedule Worker] Error processing schedules:', error);
  }
});
