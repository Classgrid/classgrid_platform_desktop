const fs = require('fs');
let routesContent = fs.readFileSync('server/src/routes/super-admin.routes.js', 'utf8');

routesContent = routesContent.replace(
  'import { getOrganizationDetail } from "../controllers/super-admin.controller.js";',
  'import { getOrganizationDetail, updateOrganizationStatus } from "../controllers/super-admin.controller.js";'
);

fs.writeFileSync('server/src/routes/super-admin.routes.js', routesContent, 'utf8');
console.log('Fixed import');
