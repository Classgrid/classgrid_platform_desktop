import mongoose from 'mongoose';
import { getChatSb } from '../config/supabaseClient.js';

export const getMcpTools = () => [
  {
    name: 'unified_db_query',
    description: 'Executes a direct read or write query against MongoDB or Supabase. You can use this to access ANY data in the system (e.g. Users, Tickets, Logs, Classes).',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['mongodb', 'supabase'],
          description: 'The database source to query.'
        },
        collectionOrTable: {
          type: 'string',
          description: 'The name of the MongoDB collection or Supabase table.'
        },
        operation: {
          type: 'string',
          enum: ['find', 'findOne', 'insert', 'update', 'delete', 'countDocuments'],
          description: 'The operation to perform.'
        },
        query: {
          type: 'object',
          description: 'The JSON query filter (MongoDB) or Match object (Supabase).'
        },
        data: {
           type: 'object',
           description: 'The payload for insert or update operations.'
        }
      },
      required: ['source', 'collectionOrTable', 'operation'],
    },
  }
];

export const handleToolCall = async (name, args) => {
  console.log(`[MCP Tool Called] ${name}`, args);

  try {
    if (name === 'unified_db_query') {
        const { source, collectionOrTable, operation, query = {}, data = {} } = args;

        if (source === 'mongodb') {
            if (!mongoose.connection.db) {
                throw new Error("MongoDB connection not established");
            }
            const collection = mongoose.connection.db.collection(collectionOrTable);
            let result;
            
            if (operation === 'find') {
                result = await collection.find(query).limit(50).toArray();
            } else if (operation === 'findOne') {
                result = await collection.findOne(query);
            } else if (operation === 'countDocuments') {
                result = { count: await collection.countDocuments(query) };
            } else if (operation === 'update') {
                result = await collection.updateMany(query, { $set: data });
            } else if (operation === 'insert') {
                result = await collection.insertMany(Array.isArray(data) ? data : [data]);
            } else if (operation === 'delete') {
                result = await collection.deleteMany(query);
            } else {
                throw new Error(`Unsupported MongoDB operation: ${operation}`);
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        } 
        else if (source === 'supabase') {
            const sb = getChatSb();
            let result;

            if (operation === 'find' || operation === 'findOne') {
                let sbQuery = sb.from(collectionOrTable).select('*').match(query).limit(operation === 'findOne' ? 1 : 50);
                const { data: sbData, error } = await sbQuery;
                if (error) throw error;
                result = operation === 'findOne' ? (sbData[0] || null) : sbData;
            } else if (operation === 'insert') {
                const { data: sbData, error } = await sb.from(collectionOrTable).insert(data).select();
                if (error) throw error;
                result = sbData;
            } else if (operation === 'update') {
                const { data: sbData, error } = await sb.from(collectionOrTable).update(data).match(query).select();
                if (error) throw error;
                result = sbData;
            } else if (operation === 'delete') {
                const { data: sbData, error } = await sb.from(collectionOrTable).delete().match(query).select();
                if (error) throw error;
                result = sbData;
            } else {
                throw new Error(`Unsupported Supabase operation: ${operation}`);
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        } else {
            throw new Error(`Unsupported data source: ${source}`);
        }
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error(`[MCP Tool Error] ${name}:`, error);
    return {
        isError: true,
        content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }],
    };
  }
};
