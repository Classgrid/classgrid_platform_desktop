import mongoose from 'mongoose';
import { handleToolCall } from './src/mcp/tools.js';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    const args = { source: 'mongodb', collectionOrTable: 'User', operation: 'find', query: { role: 'org_admin' } };
    const context = { userEmail: 'admin@classgrid.in', userRole: 'super_admin' };
    const result = await handleToolCall('unified_db_query', args, context);
    console.log(result.content[0].text.substring(0, 1500));
  } catch (e) {
      console.log("Error:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}
run();
