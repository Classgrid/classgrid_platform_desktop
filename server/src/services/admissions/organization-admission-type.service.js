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

const CET_STRUCTURE_TYPES = new Set([
    "engineering",
    "engineering_with_div",
    "engineering_no_div",
    "diploma",
    "diploma_with_div",
    "diploma_no_div",
]);

const SCHOOL_STRUCTURE_TYPES = new Set([
    "school",
    "school_with_div",
    "school_no_div",
]);

const JUNIOR_COLLEGE_STRUCTURE_TYPES = new Set([
    "junior_college",
    "junior_college_with_div",
    "junior_college_no_div",
]);

const COACHING_STRUCTURE_TYPES = new Set(["coaching"]);

export function resolveStructureType(organization = {}) {
    return (
        organization.structure_type ||
        organization.admission_config?.structure_type ||
        organization.admission_config?.admission_preset ||
        null
    );
}

export function isCETStructureType(structureType) {
    return CET_STRUCTURE_TYPES.has(structureType);
}

export function isSchoolStructureType(structureType) {
    return SCHOOL_STRUCTURE_TYPES.has(structureType);
}

export function isJuniorCollegeStructureType(structureType) {
    return JUNIOR_COLLEGE_STRUCTURE_TYPES.has(structureType);
}

export function isCoachingStructureType(structureType) {
    return COACHING_STRUCTURE_TYPES.has(structureType);
}

export function getAdmissionTrack(structureType) {
    return isCETStructureType(structureType) ? "cet" : "direct";
}

export function assertAdmissionTrack(structureType, expectedTrack) {
    const actualTrack = getAdmissionTrack(structureType);
    if (actualTrack !== expectedTrack) {
        throw new Error(
            `Invalid admission track for structure_type "${structureType}". Expected "${expectedTrack}", got "${actualTrack}".`
        );
    }
}

export function getDefaultQuotaByStructureType(structureType) {
    if (isCoachingStructureType(structureType)) return "REGULAR";
    if (isSchoolStructureType(structureType)) return "GENERAL";
    if (isJuniorCollegeStructureType(structureType) || isCETStructureType(structureType)) return "CAP";
    return "GENERAL";
}

export default {
    resolveStructureType,
    isCETStructureType,
    isSchoolStructureType,
    isJuniorCollegeStructureType,
    isCoachingStructureType,
    getAdmissionTrack,
    assertAdmissionTrack,
    getDefaultQuotaByStructureType,
};
