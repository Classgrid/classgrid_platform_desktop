import mongoose from 'mongoose';
import { handleToolCall } from './src/mcp/tools.js';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    
    console.log("🚀 Executing MCP Tool directly...");
    const args = {
        source: 'mongodb',
        collectionOrTable: 'User',
        operation: 'find',
        query: { role: 'org_admin' }
    };
    
    // Simulating super admin context
    const context = { userEmail: 'admin@classgrid.in', userRole: 'super_admin' };
    
    const result = await handleToolCall('unified_db_query', args, context);
    
    if (result.isError) {
        console.error("MCP Tool Error:", result.content[0].text);
        return;
    }
    
    const rawData = JSON.parse(result.content[0].text.split('\n\n[SYSTEM DIRECTIVE')[0]);
    
    console.log(`\n✅ MCP Tool returned ${rawData.length} items.`);
    console.log("\n--- ORG ADMIN DATA EXPORT ---");
    
    rawData.forEach((admin, i) => {
        const orgName = admin.organization_details && admin.organization_details.length > 0 
            ? admin.organization_details[0].name 
            : "[No Organization Attached]";
            
        console.log(`${i+1}. ${admin.name} | ${admin.email} | Org: ${orgName}`);
    });
    
  } catch (e) {
      console.log("Error:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
