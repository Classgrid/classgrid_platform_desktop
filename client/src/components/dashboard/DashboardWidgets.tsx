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

type StatTileProps = {
  label: string;
  value: string;
  meta?: string;
};

type TableColumn = {
  key: string;
  label: string;
};

type TablePanelProps = {
  title: string;
  actions?: string[];
  columns: TableColumn[];
  rows: Record<string, string>[];
};

type ActivityEntry = {
  label: string;
  time?: string;
  detail?: string;
};

type ActivityFeedProps = {
  title: string;
  entries: Array<string | ActivityEntry>;
  cta?: string;
};

export function StatTile({ label, value, meta }: StatTileProps) {
  return (
    <article className=" ">
      <p className="">{label}</p>
      <strong className="">{value}</strong>
      {meta ? <small className="">{meta}</small> : null}
    </article>
  );
}

export function TablePanel({ title, actions = [], columns, rows }: TablePanelProps) {
  return (
    <article className="">
      <div className="">
        <div>
          <h3>{title}</h3>
          {actions.length > 0 ? (
            <div className="">
              {actions.map((action) => (
                <span key={action} className="">
                  {action}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <table className="">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={`${title}-${rowIdx}`}>
              {columns.map((column) => (
                <td key={`${rowIdx}-${column.key}`}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}

export function ActivityFeed({ title, entries, cta }: ActivityFeedProps) {
  return (
    <article className="">
      <div className="">
        <h3>{title}</h3>
        {cta ? <small className="">{cta}</small> : null}
      </div>

      <ul className="">
        {entries.map((entry) => {
          const item =
            typeof entry === "string"
              ? { label: entry }
              : entry;

          return (
            <li key={`${item.label}-${item.time ?? "item"}`} className="">
              <div className="">
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
              </div>
              {item.time ? <small className="">{item.time}</small> : null}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
