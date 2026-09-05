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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

type WorkModule = {
  label: string;
  route: string;
};

export const facultyWorkModules: WorkModule[] = [
  { label: "My Class", route: "/faculty/my-class" },
  { label: "My Roles", route: "/faculty/my-roles" },
  { label: "Assignments", route: "/assignments" },
  { label: "Internal Test", route: "/modules/internal-test" },
  { label: "Academic Planning", route: "/modules/academic-planning" },
  { label: "Curriculum", route: "/org/curriculum" },
  { label: "Certificate", route: "/modules/certificate" },
  { label: "Attendance", route: "/modules/attendance" },
  { label: "Manage Leaves", route: "/modules/leave" },
  { label: "Events", route: "/modules/events" },
  { label: "Result", route: "/results" },
  { label: "Feedback", route: "/modules/feedback" },
  { label: "My Time Table", route: "/modules/timetable" },
  { label: "Examination", route: "/modules/examination" },
  { label: "Quiz Manager", route: "/modules/quiz-manager" },
  { label: "Holidays", route: "/modules/holidays" },
  { label: "Go Live", route: "/modules/go-live" },
  { label: "Classgrid AI", route: "/modules/ai" },
  { label: "Online Exam Builder", route: "/exam/online/builder" },
  { label: "Exam Grading", route: "/exam/grading" },
  { label: "Analytics", route: "/faculty/analytics" },
  { label: "Notes Marketplace", route: "/marketplace" },
  { label: "Canteen", route: "/canteen" },
  { label: "Alumni", route: "/org/alumni" },
  { label: "Profile", route: "/profile" }
];

export const studentWorkModules: WorkModule[] = [
  { label: "My Class", route: "/student/my-class" },
  { label: "Assignments", route: "/assignments" },
  { label: "Internal Test", route: "/modules/internal-test" },
  { label: "Academic Planning", route: "/modules/academic-planning" },
  { label: "Curriculum", route: "/org/curriculum" },
  { label: "Certificate", route: "/modules/certificate" },
  { label: "Attendance", route: "/modules/attendance" },
  { label: "Apply for Leave", route: "/modules/leave" },
  { label: "Events", route: "/modules/events" },
  { label: "Result", route: "/results" },
  { label: "Feedback", route: "/modules/feedback" },
  { label: "My Time Table", route: "/modules/timetable" },
  { label: "Examination", route: "/modules/examination" },
  { label: "Quizzes", route: "/student/quizzes" },
  { label: "Holidays", route: "/modules/holidays" },
  { label: "Classgrid AI", route: "/modules/ai" },
  { label: "Hostel", route: "/modules/hostel" },
  { label: "Library", route: "/student/library" },
  { label: "Fees", route: "/modules/fees" },
  { label: "Canteen", route: "/canteen" },
  { label: "Notes Marketplace", route: "/marketplace" },
  { label: "Alumni", route: "/student/alumni" },
  { label: "Profile", route: "/profile" }
];
