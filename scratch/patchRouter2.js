const fs = require('fs');
const p = 'client/src/app/router.tsx';
let c = fs.readFileSync(p, 'utf8');

const replacement = `<Route element={<DynamicRoleLayout />}>
          {/* PUBLIC CHAT DASHBOARD */}
          <Route path="/agent" element={<SharedChatPage />} />
          <Route path="/chat/history" element={<SharedChatPage />} />
          <Route path="/requests" element={<SupportTicketsPage />} />
          <Route path="/drive" element={<StorageFilesPage />} />
          <Route path="/agent/profile" element={<SharedProfilePage />} />
          <Route path="/agent/settings" element={<SharedSettingsPage />} />`;

c = c.replace('<Route element={<DynamicRoleLayout />}>', replacement);
fs.writeFileSync(p, c);
console.log('Done');
