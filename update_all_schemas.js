const fs = require('fs');

const files = [
  'client/src/features/shared/lib/profile-strategy-selector.ts',
  'server/src/services/profile/profile-strategy-selector.js'
];

const newSections = 
  '  faculty_education_details: {\n' +
  '    key: "faculty_education_details",\n' +
  '    label: "Education Details",\n' +
  '    icon: "GraduationCap",\n' +
  '    fields: [\n' +
  '      { key: "ug_degree", label: "Undergraduate Degree", type: "text" },\n' +
  '      { key: "ug_specialization", label: "Undergraduate Specialization", type: "text" },\n' +
  '      { key: "ug_university", label: "Undergraduate University", type: "text" },\n' +
  '      { key: "ug_percentage", label: "Undergraduate Percentage", type: "number" },\n' +
  '      { key: "ug_year", label: "Undergraduate Year", type: "number" },\n' +
  '      { key: "pg_degree", label: "Postgraduate Degree", type: "text" },\n' +
  '      { key: "pg_specialization", label: "Postgraduate Specialization", type: "text" },\n' +
  '      { key: "pg_university", label: "Postgraduate University", type: "text" },\n' +
  '      { key: "pg_percentage", label: "Postgraduate Percentage", type: "number" },\n' +
  '      { key: "pg_year", label: "Postgraduate Year", type: "number" },\n' +
  '      { key: "bed_degree", label: "B.Ed Degree", type: "text" },\n' +
  '      { key: "bed_university", label: "B.Ed University", type: "text" },\n' +
  '      { key: "bed_percentage", label: "B.Ed Percentage", type: "number" },\n' +
  '      { key: "bed_year", label: "B.Ed Year", type: "number" },\n' +
  '      { key: "phd_qualified", label: "PhD (Yes/No)", type: "boolean" },\n' +
  '      { key: "phd_specialization", label: "PhD Specialization", type: "text" },\n' +
  '      { key: "phd_university", label: "PhD University", type: "text" },\n' +
  '      { key: "phd_year", label: "PhD Year", type: "number" },\n' +
  '      { key: "net_qualified", label: "NET Qualified", type: "boolean" },\n' +
  '      { key: "slet_qualified", label: "SLET Qualified", type: "boolean" },\n' +
  '    ],\n' +
  '  },\n' +
  '  admin_education_details: {\n' +
  '    key: "admin_education_details",\n' +
  '    label: "Education Details",\n' +
  '    icon: "GraduationCap",\n' +
  '    fields: [\n' +
  '      { key: "ug_degree", label: "Undergraduate Degree", type: "text" },\n' +
  '      { key: "ug_specialization", label: "Undergraduate Specialization", type: "text" },\n' +
  '      { key: "ug_university", label: "Undergraduate University", type: "text" },\n' +
  '      { key: "pg_degree", label: "Postgraduate Degree", type: "text" },\n' +
  '      { key: "pg_specialization", label: "Postgraduate Specialization", type: "text" },\n' +
  '      { key: "pg_university", label: "Postgraduate University", type: "text" },\n' +
  '      { key: "bed_degree", label: "B.Ed Degree", type: "text" },\n' +
  '      { key: "phd_qualified", label: "PhD (Yes/No)", type: "boolean" },\n' +
  '      { key: "phd_specialization", label: "PhD Specialization", type: "text" },\n' +
  '      { key: "phd_university", label: "PhD University", type: "text" },\n' +
  '    ],\n' +
  '  },\n' +
  '  staff_education_details: {\n' +
  '    key: "staff_education_details",\n' +
  '    label: "Education Details",\n' +
  '    icon: "GraduationCap",\n' +
  '    fields: [\n' +
  '      { key: "ug_degree", label: "Undergraduate Degree", type: "text" },\n' +
  '      { key: "ug_specialization", label: "Undergraduate Specialization", type: "text" },\n' +
  '      { key: "ug_university", label: "Undergraduate University", type: "text" },\n' +
  '    ],\n' +
  '  },\n' +
  '  faculty_documents: {\n' +
  '    key: "faculty_documents",\n' +
  '    label: "Upload Documents",\n' +
  '    icon: "FileUp",\n' +
  '    fields: [\n' +
  '      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },\n' +
  '      { key: "doc_pan", label: "PAN Card", type: "file_list" },\n' +
  '      { key: "doc_highest_degree", label: "Highest Degree Certificate", type: "file_list" },\n' +
  '      { key: "doc_bed", label: "B.Ed Certificate", type: "file_list" },\n' +
  '      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },\n' +
  '      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },\n' +
  '      { key: "doc_net_slet", label: "NET/SLET Certificate", type: "file_list" },\n' +
  '      { key: "doc_police_verification", label: "Police Verification Certificate", type: "file_list" },\n' +
  '    ],\n' +
  '  },\n' +
  '  admin_documents: {\n' +
  '    key: "admin_documents",\n' +
  '    label: "Upload Documents",\n' +
  '    icon: "FileUp",\n' +
  '    fields: [\n' +
  '      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },\n' +
  '      { key: "doc_pan", label: "PAN Card", type: "file_list" },\n' +
  '      { key: "doc_highest_degree", label: "Highest Degree Certificate", type: "file_list" },\n' +
  '      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },\n' +
  '      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },\n' +
  '      { key: "doc_police_verification", label: "Police Verification Certificate", type: "file_list" },\n' +
  '    ],\n' +
  '  },\n' +
  '  staff_documents: {\n' +
  '    key: "staff_documents",\n' +
  '    label: "Upload Documents",\n' +
  '    icon: "FileUp",\n' +
  '    fields: [\n' +
  '      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },\n' +
  '      { key: "doc_pan", label: "PAN Card", type: "file_list" },\n' +
  '      { key: "doc_highest_degree", label: "Highest Qualification Certificate", type: "file_list" },\n' +
  '      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },\n' +
  '      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },\n' +
  '    ],\n' +
  '  },\n' +
  '  transport_documents: {\n' +
  '    key: "transport_documents",\n' +
  '    label: "Upload Documents",\n' +
  '    icon: "FileUp",\n' +
  '    fields: [\n' +
  '      { key: "doc_aadhar", label: "Aadhar Card", type: "file_list" },\n' +
  '      { key: "doc_pan", label: "PAN Card", type: "file_list" },\n' +
  '      { key: "doc_highest_degree", label: "Highest Qualification Certificate", type: "file_list" },\n' +
  '      { key: "doc_experience", label: "Experience/Relieving Letter", type: "file_list" },\n' +
  '      { key: "doc_appointment", label: "Appointment Letter", type: "file_list" },\n' +
  '      { key: "doc_driving_license", label: "Driving License", type: "file_list" },\n' +
  '      { key: "doc_heavy_vehicle_permit", label: "Heavy Vehicle Permit", type: "file_list" },\n' +
  '      { key: "doc_puc", label: "PUC Certificate", type: "file_list" },\n' +
  '    ],\n' +
  '  },\n' +
  '  faculty_experience_details: {\n' +
  '    key: "faculty_experience_details",\n' +
  '    label: "Experience Details",\n' +
  '    icon: "Briefcase",\n' +
  '    fields: [\n' +
  '      { key: "qualification", label: "Qualification", type: "text" },\n' +
  '      { key: "department", label: "Department", type: "text" },\n' +
  '      { key: "designation", label: "Designation", type: "text" },\n' +
  '      { key: "subjectsAssigned", label: "Subjects Assigned", type: "text" },\n' +
  '      { key: "subject", label: "Primary Subject", type: "text" },\n' +
  '      { key: "experience_years", label: "Experience (Years)", type: "number" },\n' +
  '      { key: "experience_details", label: "Experience Details", type: "text" },\n' +
  '    ],\n' +
  '  },\n' +
  '  admin_experience_details: {\n' +
  '    key: "admin_experience_details",\n' +
  '    label: "Experience Details",\n' +
  '    icon: "Briefcase",\n' +
  '    fields: [\n' +
  '      { key: "qualification", label: "Qualification", type: "text" },\n' +
  '      { key: "department", label: "Department", type: "text" },\n' +
  '      { key: "designation", label: "Designation", type: "text" },\n' +
  '      { key: "experience_years", label: "Experience (Years)", type: "number" },\n' +
  '      { key: "experience_details", label: "Experience Details", type: "text" },\n' +
  '      { key: "responsibilities", label: "Responsibilities", type: "text" },\n' +
  '    ],\n' +
  '  },\n' +
  '  staff_experience_details: {\n' +
  '    key: "staff_experience_details",\n' +
  '    label: "Experience Details",\n' +
  '    icon: "Briefcase",\n' +
  '    fields: [\n' +
  '      { key: "qualification", label: "Qualification", type: "text" },\n' +
  '      { key: "department", label: "Department", type: "text" },\n' +
  '      { key: "designation", label: "Designation", type: "text" },\n' +
  '      { key: "experience_years", label: "Experience (Years)", type: "number" },\n' +
  '      { key: "experience_details", label: "Experience Details", type: "text" },\n' +
  '    ],\n' +
  '  },\n' +
  '  exam_controller_experience_details: {\n' +
  '    key: "exam_controller_experience_details",\n' +
  '    label: "Experience Details",\n' +
  '    icon: "Briefcase",\n' +
  '    fields: [\n' +
  '      { key: "qualification", label: "Qualification", type: "text" },\n' +
  '      { key: "department", label: "Department", type: "text" },\n' +
  '      { key: "designation", label: "Designation", type: "text" },\n' +
  '      { key: "experience_years", label: "Experience (Years)", type: "number" },\n' +
  '      { key: "experience_details", label: "Experience Details", type: "text" },\n' +
  '      { key: "board_affiliation_experience", label: "Board/Affiliation Experience", type: "text" },\n' +
  '    ],\n' +
  '  },\n';

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('faculty_education_details')) {
    content = content.replace(
      'bank_details: {',
      newSections + '\n  bank_details: {'
    );
  }

  // Remove BiometricId from old experience_details block globally
  content = content.replace(/\{ key: "biometricId",\s*label: "Biometric ID",\s*type: "text"\s*\},?/g, '');

  const rolesToReplace = {
    faculty: ["faculty_education_details", "faculty_documents", "faculty_experience_details"],
    org_admin: ["admin_education_details", "admin_documents", "admin_experience_details"],
    department_admin: ["staff_education_details", "staff_documents", "staff_experience_details"],
    fee_manager: ["staff_education_details", "staff_documents", "staff_experience_details"],
    hr_dept: ["staff_education_details", "staff_documents", "staff_experience_details"],
    admission_head: ["staff_education_details", "staff_documents", "staff_experience_details"],
    admission_verifier: ["staff_education_details", "staff_documents", "staff_experience_details"],
    admission_counselor: ["staff_education_details", "staff_documents", "staff_experience_details"],
    admission_clerk: ["staff_education_details", "staff_documents", "staff_experience_details"],
    hod: ["admin_education_details", "admin_documents", "admin_experience_details"],
    principal: ["admin_education_details", "admin_documents", "admin_experience_details"],
    vice_principal: ["admin_education_details", "admin_documents", "admin_experience_details"],
    exam_controller: ["staff_education_details", "staff_documents", "exam_controller_experience_details"],
    library_manager: ["staff_education_details", "staff_documents", "staff_experience_details"],
    library_admin: ["staff_education_details", "staff_documents", "staff_experience_details"],
    attendance_admin: ["staff_education_details", "staff_documents", "staff_experience_details"],
    hostel_dept: ["staff_education_details", "staff_documents", "staff_experience_details"],
    transport_manager: ["staff_education_details", "transport_documents", "staff_experience_details"],
    tpo_officer: ["staff_education_details", "staff_documents", "staff_experience_details"],
    counselor: ["staff_education_details", "staff_documents", "staff_experience_details"],
    coordinator: ["admin_education_details", "admin_documents", "admin_experience_details"],
    student: ["education_details", "upload_documents", null]
  };

  for (const [role, [eduSection, docSection, expSection]] of Object.entries(rolesToReplace)) {
    const regex = new RegExp('(' + role + ':\\s*\\{\\s*sections:\\s*\\[)([^\\]]+)(\\])', 'g');
    content = content.replace(regex, (match, p1, p2, p3) => {
      let sections = p2.split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s);
      
      const replaceOrPush = (oldKey, newKey) => {
        if (!newKey) {
            sections = sections.filter(s => s !== oldKey);
            return;
        }
        const idx = sections.indexOf(oldKey);
        if (idx !== -1) sections[idx] = newKey;
        else if (!sections.includes(newKey)) sections.push(newKey);
      };

      replaceOrPush('education_details', eduSection);
      replaceOrPush('upload_documents', docSection);
      replaceOrPush('experience_details', expSection);
      
      return p1 + sections.map(s => '"' + s + '"').join(', ') + p3;
    });
  }

  fs.writeFileSync(file, content);
  console.log('Updated file ' + file);
});
