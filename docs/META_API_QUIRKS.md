# Meta Graph API - Setup & Quirks Guide

This document summarizes the necessary configuration, permissions, and API quirks discovered when integrating Facebook Pages and Instagram Business accounts into the Classgrid AI backend.

## 1. System User & Permanent Tokens
To allow a backend server to interact with Meta APIs indefinitely, you must use a **System User** token.
- **Where to generate:** Business Settings -> System Users -> Generate Token.
- **Critical Requirement:** The System User must have the Facebook Page and Instagram Account assigned to it as Assets with "Full Control".

## 2. Missing Permissions (The "Use Case" Bug)
If you try to generate a System User token but critical permissions (like `pages_messaging`, `instagram_manage_messages`, etc.) are completely missing from the checkbox list, Meta is hiding them because the App is missing the correct "Use Cases".

**The Fix:**
1. Go to the Developer Dashboard (developers.facebook.com).
2. Go to **Use Cases** on the left menu.
3. Add the following Use Cases to your app:
   - *Manage and access Page data*
   - *Respond to and manage Page conversations* (or *Page messaging*)
   - *Instagram messaging*
4. Once added, the permissions will become visible in the System User token generator.

## 3. Instagram Direct Messages (DMs)
Instagram Messaging has several massive traps that will cause API errors (`#3 Application does not have capability` or `#100 The Page is not linked`).

**App/Mobile Requirement:** 
Third-party apps are completely blocked from reading Instagram DMs until a switch is manually toggled on the user's mobile phone.
- **Fix:** Open the Instagram Mobile App -> Settings -> Messages and story replies -> Message controls -> Turn ON "Allow access to messages" at the very bottom.

**API Endpoint Requirement:**
Instagram DMs are treated as an extension of Facebook Messenger. Therefore, the Meta Graph API requires you to use the **Facebook Page ID**, not the Instagram Account ID!
- **Correct List Messages:** `GET /v19.0/{page-id}/conversations?platform=instagram`
- **Correct Send Message:** `POST /v19.0/{page-id}/messages`

## 4. Retrieving Follower Lists (Privacy Block)
Meta strictly prohibits developers from retrieving a raw list of usernames that follow a specific Instagram account due to privacy restrictions.
- There is NO `list_followers` operation.
- **Workaround:** You can only retrieve the total *number* of followers (`followers_count`) via the `/{ig-account-id}?fields=followers_count` endpoint.

## 5. Insights Metrics Deprecation
Meta frequently deprecates API metrics. For `get_insights` on Instagram accounts, the `impressions` metric has been deprecated. 
- **Correct Usage:** You must use `metric=reach,follower_count` (do not use `impressions` or `profile_views` unless `metric_type=total_value` is explicitly handled).
