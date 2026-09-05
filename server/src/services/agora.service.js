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

import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = pkg;
import "../../env.js";
import accessLogger from "../config/logger.js";

const APP_ID = process.env.AGORA_APP_ID || "PLACEHOLDER_APP_ID";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "PLACEHOLDER_CERTIFICATE";

/**
 * generateRtcToken
 * Generates a secure RTC token for a specific channel (e.g. classroomId).
 * 
 * @param {string} channelName  Classroom or Chat ID
 * @param {string} uid          Numeric UID (Agora requires integers or strings, using string uid here)
 * @param {string} role         'publisher' or 'subscriber'
 * @param {number} expiryTime   How long the token is valid (seconds)
 */
export const generateRtcToken = (channelName, uid, role = 'publisher', expiryTime = 3600) => {
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + expiryTime;
    
    const tokenRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        tokenRole,
        privilegeExpireTime
    );

    accessLogger.info(`Generated Agora RTC token for channel ${channelName}`, {
        provider: 'agora',
        channel: channelName,
        role: role
    });

    return token;
};

/**
 * generateRtmToken
 * Generates a secure RTM (Real-Time Messaging) token for a specific user.
 * Required for signaling, chat, and call-ringing.
 * 
 * @param {string} uid          The user's unique ID
 * @param {number} expiryTime   How long the token is valid (seconds)
 */
export const generateRtmToken = (uid, expiryTime = 3600) => {
    const privilegeExpireTime = Math.floor(Date.now() / 1000) + expiryTime;

    const token = RtmTokenBuilder.buildToken(
        APP_ID,
        APP_CERTIFICATE,
        uid,
        privilegeExpireTime
    );

    accessLogger.info(`Generated Agora RTM token`, {
        provider: 'agora'
    });

    return token;
};
