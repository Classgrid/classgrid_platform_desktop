# AI Token Limits Upgrade Plan (MongoDB Defaults to Cloudflare KV)

## Current Hardcoded Limits (To Be Replaced)
1. **Organization Monthly Pro Pool**: `500,000` Credits (Default in Organization.js)
2. **User Weekly Free Pool**: `100,000` Credits (Default in User.js and various controllers)
3. **User Weekly Free Images**: `20` Images (Default in User.js)

## Objective
Migrate hardcoded fallback values into a dynamic Cloudflare KV store (or DB configuration) and build a comprehensive Super Admin AI management suite. This allows Super Admins to manage global limits, set per-org overrides, block access, and gift credits to users.

## 🚀 Feature Requirements

### 1. Global AI Limits & Dashboard (Super Admin)
- **Global Settings Page:** UI to set the global default limits for `Organization Monthly Pro Pool` (500k), `User Weekly Free Pool` (100k), and `Free Images` (20).
- **Global Progress Bar:** Add a 0-100% progress bar showing the total global tokens used vs some target/capacity.
- **Global Activity Charts:** Bar graphs showing the "Most Active Day" and "Least Used Day" across the entire platform.

### 2. Organization-Specific Limits & Details
- **Custom Overrides:** Ability to open a specific organization's detail page and override the global limits with custom weekly/monthly token limits.
- **Organization Progress Bar:** Use the existing blue progress bar component (from the AI Credits page) to show `Tokens Used vs Tokens Remaining` for the organization.
- **Block AI Access:** Add a toggle to "Block AI" for a specific organization. If toggled ON, no AI requests will go through for any user in that org, and the UI will show "AI Stopped".
- **Reset Credits:** Add a button to manually reset an organization's AI credits.

### 3. User & Role Usage Tracking
- **Top Users Table:** Inside the Org details page, show a table of the top AI users.
- **Role Filters:** Add filters to sort this table by roles (e.g., show top faculty users vs top student users).
- **Individual User View:** Ability to click into a user's profile and see their specific individual AI usage.

### 4. Super Admin Gifting System (Bulk Panel like AI Hub)
- **Centralized Gifting Panel:** A dedicated panel/modal (similar to the AI Hub) where the Super Admin can gift credits in bulk.
- **Advanced Target Selection:** Select recipients based on:
  - **Global:** Gift to everyone on the platform.
  - **Organization-Wise:** Gift to an entire school/organization.
  - **Role-Wise:** Gift to specific roles (e.g., all faculty or all students).
  - **Individual Users:** Pick specific names/emails from a list.
- **Amount Allocation Toggle:** Ability to send the *same* amount of credits to everyone selected, or toggle to assign *separate/custom* amounts per recipient in the list.
- **Billing History & Auto-Email:** Automatically inserts the gifted credits into their "AI Credits" billing history as a Top-Up, and sends an automated notification email to all recipients.

## Affected Components

### 1. Database Schemas & KV
- `Organization.js` and `User.js` (Update defaults/add override fields if necessary).
- Ensure `ai_config.is_ai_blocked` is strictly enforced at the API gateway/controller level.

### 2. Backend Controllers
- `ai-chat.controller.js`: Enforce the new "Block AI" flag. Stop requests immediately if blocked.
- `ai-credits.controller.js`: Build the new "Gift Credits" API endpoint to handle the transaction and send the email.

### 3. Frontend UI
- Global AI Dashboard (`AiUsageDashboardPage.tsx`)
- Org AI Details Page (Needs custom limits UI, progress bar, top users table, block toggle, reset button).
- Super Admin Gifting UI (Modal to select user, amount, and dispatch).

## Next Steps
(Awaiting further specific instructions on which file to tackle first...)
Global vs Custom Org Limits:

Global limits configurable on the first page.
Ability to open an organization's specific details page and override those defaults with a custom limit.
Usage Progress Bars:

0 to 100% Global progress bar on the first page showing total platform usage.
Re-using the exact "Blue Bar" component from the AI Credits page to show Tokens Used vs Tokens Remaining individually on each organization's page.
User Tracking & Top Users Table:

A table on the Org details page showing the top users, with a filter so Super Admins can sort by Role (faculty vs student, etc).
Individual user views showing their exact usage slice.
Analytics Charts:

Bar graphs showing the "Most Active Day" and "Least Used Days".
Security Controls (Block AI & Reset):

A toggle to entirely Block AI for a specific organization (immediately showing "AI Stopped" and dropping all API requests for them).
A "Reset Credits" button.
Super Admin Gifting:

A new feature allowing you to override the standard "purchase" flow. You can go to any user's profile and "Gift" them credits directly.
It will automatically show up correctly in their Billing History table.
It will trigger an automatic email to them letting them know the