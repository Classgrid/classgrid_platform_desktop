const fs = require('fs');
const p = 'client/src/app/router.tsx';
let c = fs.readFileSync(p, 'utf8');

const target = '<Route element={<DynamicRoleLayout />}>\n          {/* Website CMS */}';
const replacement = `<Route element={<DynamicRoleLayout />}>
          {/* PUBLIC CHAT DASHBOARD */}
          <Route path="/agent" element={<SharedChatPage />} />
          <Route path="/chat/history" element={<SharedChatPage />} />
          <Route path="/requests" element={<SupportTicketsPage />} />
          <Route path="/drive" element={<StorageFilesPage />} />
          <Route path="/agent/profile" element={<SharedProfilePage />} />
          <Route path="/agent/settings" element={<SharedSettingsPage />} />

          {/* Website CMS */}`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(p, c);
  console.log('Done');
} else {
  console.log('Not found');
}
