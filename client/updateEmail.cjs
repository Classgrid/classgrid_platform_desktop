const fs = require('fs');
const file = 'C:\\CLASSGRIDPLATFORM\\classgrid_platoform-desktop-\\client\\src\\features\\shared\\pages\\SharedProfilePage.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{!isGroup && form.email && (
                      <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Mail size={16} /> {form.email}</span>
                    )}`;
const replacement = `{!isGroup && form.email && (!isReadOnly || !(publicUser?.privacySettings?.hideEmail || profileData?.user?.privacySettings?.hideEmail)) && (
                      <span className="flex items-center gap-2 hover:text-foreground transition-colors"><Mail size={16} /> {form.email}</span>
                    )}`;

content = content.replace(target, replacement);

const target2 = `                  <SuperAdminProfileView profileData={profileData?.user || {}} />`;
const replacement2 = `                  <SuperAdminProfileView profileData={profileData?.user || {}} isReadOnly={isReadOnly} />`;

content = content.replace(target2, replacement2);

fs.writeFileSync(file, content);
console.log('Done');
