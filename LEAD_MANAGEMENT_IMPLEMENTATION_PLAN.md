# Lead Management - Implementation Plan

## 1. The Core Handoff Logic & Bug Fixes (Backend)
- **Reschedule Status Bug:** When a meeting is rescheduled via the 'Change' button, the backend will correctly detect it and set the status to 
escheduled instead of just scheduled.
- **Unassign on Reschedule:** When a reschedule happens, the lead intentionally becomes unassigned again, so the Super Admin (Nikhil) can manually hand it off to another admin (Gemini).
- **Completed Meeting UI:** When the meeting is marked as 'Completed', the 'Change' button in the top right will disappear/update so nobody can accidentally reschedule a completed meeting.

## 2. The New UI Layout (Bottom of Page)
At the absolute bottom of the Lead Details page, completely full width, we will build the **Lead Management & Status** section. It will be broken down into separate mini-sections, each with its own Save button so fields can be updated independently:

- **A. Assignment Handoff:** Dropdown to manually pick the Admin (for handing off leads). 
- **B. Status & Tracking:** Dropdowns for Meeting Status (Pending, Scheduled, Completed, Cancelled, Rescheduled, Missed) and Lifecycle Stage (Lead Created, Meeting Scheduled, Approved, Provisioned, Activated, Setup, Live).
- **C. Discovery & Requirements:** Number inputs for Student Count, Staff Count, Campus Count, and a dropdown for Current System. *(Collected during the meeting).*
- **D. Meeting Notes & Review:** Two separate large text boxes. One for the meeting notes/feedback, and a second one specifically for the 'Review' from the school.
- **E. Organization Vetted:** The checkbox to verify the school and unlock provisioning.

## 3. The Business Lifecycle (For Context)
- Provisioning just creates a 31-day **Sandbox**.
- After 31 days, it goes to **In Progress** (dashboard blocked, 2 days to pay).
- If they pay 3 months, it becomes **Active**. If they don't, it is deleted after collecting a review.
