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

import { Link } from "react-router-dom";

type WorkModule = {
  label: string;
  route: string;
};

type WorkModuleGridProps = {
  modules: WorkModule[];
};

export function WorkModuleGrid({ modules }: WorkModuleGridProps) {
  return (
    <section className="">
      {modules.map((module) => (
        <Link key={module.route} className="" to={module.route}>
          <span>{module.label}</span>
        </Link>
      ))}
    </section>
  );
}
