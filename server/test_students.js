import mongoose from 'mongoose';
import { handleToolCall } from './src/mcp/tools.js';

const uri = "mongodb+srv://classgrid-admin:aiLfOjcURw9UUALw@classgrid.sa5ww0z.mongodb.net/classgrid?retryWrites=true&w=majority&appName=Classgrid&authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    
    console.log("🚀 Executing MCP Tool for STUDENTS...");
    const args = {
        source: 'mongodb',
        collectionOrTable: 'User',
        operation: 'find',
        query: { role: 'student' }
    };
    
    const context = { userEmail: 'admin@classgrid.in', userRole: 'super_admin' };
    const result = await handleToolCall('unified_db_query', args, context);
    
    if (result.isError) {
        console.error("MCP Tool Error:", result.content[0].text);
        return;
    }
    
    const rawText = result.content[0].text.split('\n\n[SYSTEM DIRECTIVE')[0];
    const rawData = JSON.parse(rawText);
    
    console.log(`\n✅ MCP Tool returned ${rawData.length} students.`);
    if (rawData.length > 0) {
        console.log("First student:", rawData[0].name);
    }
    
  } catch (e) {
      console.log("Error:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
