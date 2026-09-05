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

export const ERP_OPTIONS = {
  bloodGroups: ["O-ve", "O+ve", "A-ve", "A+ve", "B-ve", "B+ve", "AB-ve", "AB+ve", "AB RH -v", "O RH +ve", "O RH -ve", "B RH +ve", "A RH - ve", "A RH +ve", "NA", "AB RH +ve"],
  domiciles: ["Maharastra", "Outside Maharastra", "Foreign"],
  maritalStatuses: ["UNMARRIED", "MARRIED"],
  religions: ["Hindu", "Christian", "Islam", "Buddhist", "Sikh", "Judai", "Baha", "Confucian", "Jain", "Shinto", "Parsi", "Other", "Muslim", "NA", "-"],
  admissionCategories: ["J & K Migrant", "OPEN", "ST", "SC", "VJ/DT", "TFWS", "NT 1 (NT-B)", "NT 2 (NT-C)", "NT 3 (NT-D)", "SBC", "OBC", "EWS", "CENTRAL MINORITY", "STATE MINORITY", "FOREIGN STUDENTS", "NRI", "PIO / OCI", "CIWGC", "NEUT", "JKSSS / PMSSS", "FN-ICCR", "OMS", "Institute Level", "Against CAP", "EBC", "SEBC", "VJ/NT", "SEBC"],
  genders: ["Male", "Female"],
  minorities: ["Jain", "muslim"],
  relations: ["Father", "Mother", "Brother", "Sister", "Uncle", "Son", "Daughter", "Wife", "Husband", "Grandmother", "Grandfather", "Aunty", "NA", "Local Guardian"],
  scholarshipTypes: ["EBC", "ESBC", "EWS", "Freeship", "Not Applicable", "Open-Seda", "Over and Above", "Scholarship", "TFWS"],
  areaTypes: ["Rural", "Urban"],
  yesNo: ["No", "Yes"]
};
