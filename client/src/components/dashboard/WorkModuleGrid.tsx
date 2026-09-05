/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
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
