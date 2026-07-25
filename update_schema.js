const fs = require('fs');

const files = [
  'client/src/features/shared/lib/profile-strategy-selector.ts',
  'server/src/services/profile/profile-strategy-selector.js'
];

const newSections = `
  faculty_education_details: {
    key: "faculty_education_details",
    label: "Education Details",
    icon: "GraduationCap",
    fields: [
      { key: "ug_degree", label: "Undergraduate Degree", type: "text" },
      { key: "ug_specialization", label: "Undergraduate Specialization", type: "text" },
      { key: "ug_university", label: "Undergraduate University", type: "text" },
      { key: "ug_percentage", label: "Undergraduate Percentage", type: "number" },
      { key: "ug_year", label: "Undergraduate Year", type: "number" },
      { key: "pg_degree", label: "Postgraduate Degree", type: "text" },
      { key: "pg_specialization", label: "Postgraduate Specialization", type: "text" },
      { key: "pg_university", label: "Postgraduate University", type: "text" },
      { key: "pg_percentage", label: "Postgraduate Percentage", type: "number" },
      { key: "pg_year", label: "Postgraduate Year", type: "number" },
      { key: "bed_degree", label: "B.Ed Degree", type: "text" },
      { key: "bed_university", label: "B.Ed University", type: "text" },
      { key: "bed_percentage", label: "B.Ed Percentage", type: "number" },
      { key: "bed_year", label: "B.Ed Year", type: "number" },
      { key: "phd_qualified", label: "PhD (Yes/No)", type: "boolean" },
      { key: "phd_specialization", label: "PhD Specialization", type: "text" },
      { key: "phd_university", label: "PhD University", type: "text" },
      { key: "phd_year", label: "PhD Year", type: "number" },
      { key: "net_qualified", label: "NET Qualified", type: "boolean" },
      { key: "slet_qualified", label: "SLET Qualified", type: "boolean" },
    ],
  },
  admin_education_details: {
    key: "admin_education_details",
    label: "Education Details",
    icon: "GraduationCap",
    fields: [
      { key: "ug_degree", label: "Undergraduate Degree", type: "text" },
      { key: "ug_specialization", label: "Undergraduate Specialization", type: "text" },
      { key: "ug_university", label: "Undergraduate University", type: "text" },
      { key: "pg_degree", label: "Postgraduate Degree", type: "text" },
      { key: "pg_specialization", label: "Postgraduate Specialization", type: "text" },
      { key: "pg_university", label: "Postgraduate University", type: "text" },
      { key: "bed_degree", label: "B.Ed Degree", type: "text" },
      { key: "phd_qualified", label: "PhD (Yes/No)", type: "boolean" },
      { key: "phd_specialization", label: "PhD Specialization", type: "text" },
      { key: "phd_university", label: "PhD University", type: "text" },
    ],
  },
  staff_education_details: {
    key: "staff_education_details",
    label: "Education Details",
    icon: "GraduationCap",
    fields: [
      { key: "ug_degree", label: "Undergraduate Degree", type: "text" },
      { key: "ug_specialization", label: "Undergraduate Specialization", type: "text" },
      { key: "ug_university", label: "Undergraduate University", type: "text" },
    ],
  },`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Insert new sections after education_details
  if (!content.includes('faculty_education_details')) {
    content = content.replace(
      /(education_details:\s*\{[\s\S]*?\}\s*,\s*)(?=[a-z_]+:\s*\{)/,
      \`$1\n\${newSections}\n  \`
    );
  }

  // Update student config to ensure it has education_details
  content = content.replace(
    /(student:\s*\{\s*sections:\s*\[\s*)([^\]]+)(\s*\])/,
    (match, p1, p2, p3) => {
      let sectionsStr = p2.replace(/"education_details",\s*/g, ''); // remove if exists
      return \`\${p1}"education_details", \${sectionsStr}\${p3}\`;
    }
  );

  // Define role mappings
  const roleMappings = {
    faculty: "faculty_education_details",
    org_admin: "admin_education_details",
    department_admin: "staff_education_details",
    fee_manager: "staff_education_details",
    hr_dept: "staff_education_details",
    admission_head: "staff_education_details",
    admission_verifier: "staff_education_details",
    admission_counselor: "staff_education_details",
    admission_clerk: "staff_education_details",
    hod: "admin_education_details",
    principal: "admin_education_details",
    vice_principal: "admin_education_details",
    exam_controller: "staff_education_details",
    library_manager: "staff_education_details",
    library_admin: "staff_education_details",
    attendance_admin: "staff_education_details",
    hostel_dept: "staff_education_details",
    transport_manager: "staff_education_details",
    tpo_officer: "staff_education_details",
    counselor: "staff_education_details",
    coordinator: "admin_education_details"
  };

  // Replace education_details with role specific education details
  for (const [role, newSection] of Object.entries(roleMappings)) {
    const regex = new RegExp(\`(\${role}:\\s*\\{\\s*sections:\\s*\\[[^\\]]*?)"education_details"([^\\]]*\\])\`, 'g');
    content = content.replace(regex, \`$1"\${newSection}"$2\`);
  }

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
