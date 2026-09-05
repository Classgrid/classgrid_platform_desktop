/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import slugify from 'slugify';
import Organization from '../models/Organization.js';

/**
 * Generates a unique subdomain slug for an organization.
 * e.g. "Pimpri Chinchwad College" -> "pccoe" or "pimpri-chinchwad"
 */
export const generateUniqueSlug = async (name) => {
    let slug = slugify(name, {
        lower: true,
        strict: true,
        trim: true
    });

    // Check availability
    let exists = await Organization.findOne({ subdomain: slug });
    let counter = 1;
    let originalSlug = slug;

    while (exists) {
        slug = `${originalSlug}-${counter}`;
        exists = await Organization.findOne({ subdomain: slug });
        counter++;
    }

    return slug;
};
