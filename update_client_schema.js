const fs = require('fs');

const files = [
  'client/src/features/shared/lib/profile-strategy-selector.ts',
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
  },
  faculty_documents: {
    key: "faculty_documents",
    label: "Upload Documents",
    icon: "FileUp",
    fields: [
      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },
      { key: "doc_pan", label: "PAN Card", type: "file_list" },
      { key: "doc_highest_degree", label: "Highest Degree Certificate", type: "file_list" },
      { key: "doc_bed", label: "B.Ed Certificate", type: "file_list" },
      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },
      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },
      { key: "doc_net_slet", label: "NET/SLET Certificate", type: "file_list" },
      { key: "doc_police_verification", label: "Police Verification Certificate", type: "file_list" },
    ],
  },
  admin_documents: {
    key: "admin_documents",
    label: "Upload Documents",
    icon: "FileUp",
    fields: [
      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },
      { key: "doc_pan", label: "PAN Card", type: "file_list" },
      { key: "doc_highest_degree", label: "Highest Degree Certificate", type: "file_list" },
      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },
      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },
      { key: "doc_police_verification", label: "Police Verification Certificate", type: "file_list" },
    ],
  },
  staff_documents: {
    key: "staff_documents",
    label: "Upload Documents",
    icon: "FileUp",
    fields: [
      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },
      { key: "doc_pan", label: "PAN Card", type: "file_list" },
      { key: "doc_highest_degree", label: "Highest Qualification Certificate", type: "file_list" },
      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },
      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },
    ],
  },
  transport_documents: {
    key: "transport_documents",
    label: "Upload Documents",
    icon: "FileUp",
    fields: [
      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },
      { key: "doc_pan", label: "PAN Card", type: "file_list" },
      { key: "doc_highest_degree", label: "Highest Qualification Certificate", type: "file_list" },
      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },
      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },
      { key: "doc_driving_license", label: "Driving License", type: "file_list" },
      { key: "doc_heavy_vehicle_permit", label: "Heavy Vehicle Permit", type: "file_list" },
      { key: "doc_puc", label: "PUC Certificate", type: "file_list" },
    ],
  },
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Insert new sections before bank_details (which is right after education_details)
  if (!content.includes('faculty_education_details')) {
    content = content.replace(
      'bank_details: {',
      newSections + '\nbank_details: {'
    );
  }

  // Update student config to ensure it has education_details and upload_documents
  content = content.replace(
    /(student:\s*\{\s*sections:\s*\[\s*)([^\]]+)(\s*\])/,
    (match, p1, p2, p3) => {
      let sections = p2.split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);
      if (!sections.includes('education_details')) sections.push('education_details');
      if (!sections.includes('upload_documents')) sections.push('upload_documents');
      return p1 + sections.map(s => '"' + s + '"').join(', ') + p3;
    }
  );

  const rolesToEduDoc = {
    faculty: ["faculty_education_details", "faculty_documents"],
    org_admin: ["admin_education_details", "admin_documents"],
    department_admin: ["staff_education_details", "staff_documents"],
    fee_manager: ["staff_education_details", "staff_documents"],
    hr_dept: ["staff_education_details", "staff_documents"],
    admission_head: ["staff_education_details", "staff_documents"],
    admission_verifier: ["staff_education_details", "staff_documents"],
    admission_counselor: ["staff_education_details", "staff_documents"],
    admission_clerk: ["staff_education_details", "staff_documents"],
    hod: ["admin_education_details", "admin_documents"],
    principal: ["admin_education_details", "admin_documents"],
    vice_principal: ["admin_education_details", "admin_documents"],
    exam_controller: ["staff_education_details", "staff_documents"],
    library_manager: ["staff_education_details", "staff_documents"],
    library_admin: ["staff_education_details", "staff_documents"],
    attendance_admin: ["staff_education_details", "staff_documents"],
    hostel_dept: ["staff_education_details", "staff_documents"],
    transport_manager: ["staff_education_details", "transport_documents"],
    tpo_officer: ["staff_education_details", "staff_documents"],
    counselor: ["staff_education_details", "staff_documents"],
    coordinator: ["admin_education_details", "admin_documents"]
  };

  for (const [role, [eduSection, docSection]] of Object.entries(rolesToEduDoc)) {
    // We use string replacement for the exact sections array in ROLE_PROFILE_CONFIGS
    const regex = new RegExp(\`(\${role}:\\s*\\{\\s*sections:\\s*\\[)([^\\]]+)(\\])\`, 'g');
    content = content.replace(regex, (match, p1, p2, p3) => {
      let sections = p2.split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);
      
      // Replace education_details
      const eduIndex = sections.indexOf('education_details');
      if (eduIndex !== -1) sections[eduIndex] = eduSection;
      else if (!sections.includes(eduSection)) sections.push(eduSection);
      
      // Replace upload_documents
      const docIndex = sections.indexOf('upload_documents');
      if (docIndex !== -1) sections[docIndex] = docSection;
      else if (!sections.includes(docSection)) sections.push(docSection);
      
      return p1 + sections.map(s => '"' + s + '"').join(', ') + p3;
    });
  }

  fs.writeFileSync(file, content);
  console.log('Updated client side file ' + file);
});
