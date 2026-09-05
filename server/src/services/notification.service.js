/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendPushToDevice, sendPushToMultiple } from './firebase.service.js';
import { primarySupabaseClient as supabase } from '../config/supabaseClient.js';
import { sendNotificationEmail } from './notification-email.service.js';
import { sendPushNotification } from './push.service.js';

/**
 * Central Notification Dispatcher
 * Handles internal DB notifications, Firebase Push, and Email alerts.
 */
export async function dispatchNotification({
    recipientId,
    type,
    title,
    message,
    link = '',
    relatedId = '',
    sendPush = true,
    sendEmail = false,
    orgId = null,
    isCall = false // --- Day 17: VoIP Ringing Support ---
}) {
    try {
        const effectiveOrgId = orgId || (await User.findById(recipientId).select("organization_id").lean())?.organization_id;
        if (!effectiveOrgId) {
            console.log('[NotificationService] Dispatch: No organization_id found, proceeding as a system notification.');
        }

        // 1. Throttling Check (Persistent in MongoDB or Redis - using simple DB check for now)
        if (sendPush && type === 'chat') {
            const lastNotif = await Notification.findOne({
                recipient: recipientId,
                type: 'chat',
                createdAt: { $gt: new Date(Date.now() - 30 * 1000) } // 30 second throttle
            }).lean();
            if (lastNotif) {
                // Skip push but still create DB record
                sendPush = false; 
            }
        }

        // 2. Create Internal DB Notification (Mongoose)
        const notification = await Notification.create({
            organization_id: effectiveOrgId,
            recipient: recipientId,
            type,
            title,
            message,
            link,
            relatedId
        });

        // 2. Handle Firebase Push Notifications
        if (sendPush) {
            // Fetch FCM tokens from Supabase/Postgres
            const { data: tokens } = await supabase
                .from('device_tokens')
                .select('fcm_token')
                .eq('user_id', recipientId);

            if (tokens && tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.fcm_token);
                await sendPushToMultiple(fcmTokens, title, message, { link, type, relatedId, isCall });
            }

            // Web Push for Browsers
            await sendPushNotification(recipientId, { title, body: message, url: link }).catch(e => console.error("WebPush Dispatch Error:", e));
        }

        // 3. Handle Email Notifications (Optional)
        if (sendEmail) {
            // This assumes notification-email.service handles checking user prefs
            await sendNotificationEmail(recipientId, type, title, message, link);
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
        }

        return notification;
    } catch (err) {
        console.error('[NotificationService] Dispatch Error:', err.message);
        // We don't want notification failure to break the main application flow
        return null;
    }
}

/**
 * Bulk Dispatch to a list of students or faculty
 */
export async function bulkDispatchNotification({
    recipientIds,
    type,
    title,
    message,
    link = '',
    relatedId = '',
    sendPush = true,
    orgId = null
}) {
    try {
        if (!recipientIds || recipientIds.length === 0) return;
        let effectiveOrgId = orgId;
        if (!effectiveOrgId) {
            effectiveOrgId = (await User.findById(recipientIds[0]).select("organization_id").lean())?.organization_id;
        }
        
        // Ensure effectiveOrgId is a string if it's an ObjectId (to prevent React BSON crashes if logged)
        if (effectiveOrgId) {
            effectiveOrgId = effectiveOrgId.toString();
        } else {
            console.log('[NotificationService] Bulk Dispatch: Proceeding with null organization_id (e.g. System/SuperAdmin target).');
            effectiveOrgId = null;
        }

        const notifications = recipientIds.map(rid => ({
            organization_id: effectiveOrgId,
            recipient: rid,
            type,
            title,
            message,
            link,
            relatedId
        }));

        // Insert into MongoDB
        await Notification.insertMany(notifications);

        if (sendPush) {
            // Fetch all FCM tokens in one batch
            const { data: tokens } = await supabase
                .from('device_tokens')
                .select('fcm_token, user_id')
                .in('user_id', recipientIds);

            if (tokens && tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.fcm_token);
                await sendPushToMultiple(fcmTokens, title, message, { link, type, relatedId });
            }

            // Web Push for Browsers
            const webPushPromises = recipientIds.map(rid => 
                sendPushNotification(rid, { title, body: message, url: link }).catch(e => console.error("WebPush Bulk Dispatch Error:", e))
            );
            await Promise.allSettled(webPushPromises);
        }
    } catch (err) {
        console.error('[NotificationService] Bulk Dispatch Error:', err.message);
    }
}
