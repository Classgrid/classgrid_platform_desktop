/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */
import { getResolvedProfileStrategy } from './src/features/shared/lib/profile-strategy-selector';
const studentStrategy = getResolvedProfileStrategy({
  targetRole: 'student',
  viewerRole: 'student',
  orgType: 'engineering',
  structureType: 'engineering',
  isSelfView: true
});
console.log('Student Sections length:', studentStrategy.sections.length);
studentStrategy.sections.forEach(s => console.log('Student:', s.key));

const facultyStrategy = getResolvedProfileStrategy({
  targetRole: 'faculty',
  viewerRole: 'faculty',
  orgType: 'engineering',
  structureType: 'engineering',
  isSelfView: true
});
console.log('Faculty Sections length:', facultyStrategy.sections.length);
facultyStrategy.sections.forEach(s => console.log('Faculty:', s.key));
