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
