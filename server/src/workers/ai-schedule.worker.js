// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
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

        // Fire and forget AWS SES if email fields exist
        if (schedule.email_subject && schedule.email_body) {
          sendEmail({
            to: schedule.user_email,
            subject: schedule.email_subject,
            html: schedule.email_body
          }).catch(smtpErr => {
            console.warn(`[AiSchedule Worker] AWS SES SMTP threw an error. Error: ${smtpErr.message}`);
          });
        }

        // Fire and forget WhatsApp if whatsapp fields exist
        if (schedule.whatsapp_phone_number && schedule.whatsapp_message) {
          if (process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
            fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: schedule.whatsapp_phone_number,
                type: "text",
                text: {
                  preview_url: false,
                  body: schedule.whatsapp_message
                }
              })
            }).then(res => res.json()).then(data => {
              if (data.error) {
                console.warn(`[AiSchedule Worker] WhatsApp API error: ${JSON.stringify(data.error)}`);
              }
            }).catch(waErr => {
              console.warn(`[AiSchedule Worker] WhatsApp fetch failed. Error: ${waErr.message}`);
            });
          } else {
             console.warn(`[AiSchedule Worker] Missing WhatsApp credentials in .env`);
          }
        }
    }
  } catch (error) {
    console.error('[AiSchedule Worker] Error processing schedules:', error);
  }
});
