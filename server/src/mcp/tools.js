import mongoose from 'mongoose';
import { getChatSb } from '../config/supabaseClient.js';
import redis from '../config/redis.js';

export const getMcpTools = () => [
  {
    name: 'unified_db_query',
    description: 'Executes a direct read or write query against MongoDB or Supabase. You can use this to access ANY data in the system (e.g. Users, Tickets, Logs, Classes).',
    inputSchema: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['mongodb', 'supabase', 'redis'],
          description: 'The database source to query.'
        },
        collectionOrTable: {
          type: 'string',
          description: 'The name of the MongoDB collection, Supabase table, or Redis key/pattern.'
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

export const handleToolCall = async (name, args, context = {}) => {
  console.log(`[MCP Tool Called] ${name}`, args, context);

  try {
    if (name === 'unified_db_query') {
        const { source, collectionOrTable, operation, query = {}, data = {} } = args;
        const { userEmail = '', userRole = '', subdomain = '' } = context;
        const isSuperAdmin = userEmail.endsWith('@classgrid.in') || userRole === 'super_admin';

        if (source === 'mongodb') {
            if (!mongoose.connection.db) {
                throw new Error("MongoDB connection not established");
            }

            // Map cheat sheet model names to actual pluralized collection names
            const collectionMap = {
                'SupportTicket': 'supporttickets',
                'SupportConversation': 'supportconversations',
                'Message': 'messages',
                'DemoRequest': 'demorequests',
                'User': 'users',
                'UserProfile': 'userprofiles',
                'Organization': 'organizations',
                'SystemLog': 'systemlogs',
                'ActivityLog': 'activitylogs',
                'Assignment': 'assignments',
                'AssignmentSubmission': 'assignmentsubmissions',
                'Note': 'notes',
                'Classroom': 'classrooms',
                'Attendance': 'attendances',
                'AttendanceRecord': 'attendancerecords',
                'Exam': 'exams',
                'FeeRecord': 'feerecords',
                'Invoice': 'invoices',
                'Lead': 'leads'
            };
            // Fallback for models not explicitly mapped: lowercase and add 's' (Mongoose default)
            let actualCollectionName = collectionMap[collectionOrTable];
            if (!actualCollectionName) {
                if (collectionOrTable.endsWith('y')) {
                    actualCollectionName = collectionOrTable.slice(0, -1).toLowerCase() + 'ies';
                } else {
                    actualCollectionName = collectionOrTable.toLowerCase() + 's';
                }
            }
            
            // --- LAYER 2 RBAC SECURITY ENFORCEMENT ---
            const superAdminOnlyCollections = [
                'systemlogs', 'activitylogs', 'organizations', 'users', 
                'supporttickets', 'demorequests', 'billingexportjobs', 
                'invoices', 'platformtransactions', 'adminauditlogs'
            ];
            
            if (superAdminOnlyCollections.includes(actualCollectionName) && !isSuperAdmin) {
                 return { 
                     content: [{ type: 'text', text: `SECURITY ERROR: Access Denied. Database firewall blocked role '${userRole}' from accessing restricted collection '${actualCollectionName}'.` }] 
                 };
            }
            
            const collection = mongoose.connection.db.collection(actualCollectionName);
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

            // --- LAYER 2 RBAC SECURITY ENFORCEMENT ---
            const superAdminOnlyTables = ['email_notification_queue', 'holidays'];
            if (superAdminOnlyTables.includes(collectionOrTable.toLowerCase()) && !isSuperAdmin) {
                 return { 
                     content: [{ type: 'text', text: `SECURITY ERROR: Access Denied. Database firewall blocked role '${userRole}' from accessing restricted table '${collectionOrTable}'.` }] 
                 };
            }

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
        } 
        else if (source === 'redis') {
            if (!redis || redis.status !== 'ready') {
                throw new Error("Redis connection not established");
            }
            let result;
            const key = collectionOrTable; // collectionOrTable is used as the Redis key or pattern

            if (operation === 'find') {
                // Return all keys matching pattern (e.g. "user:profile:*")
                result = await redis.keys(key);
            } else if (operation === 'findOne') {
                const type = await redis.type(key);
                if (type === 'hash') {
                    result = await redis.hgetall(key);
                } else if (type === 'string') {
                    result = await redis.get(key);
                    try { result = JSON.parse(result); } catch (e) { /* ignore */ }
                } else if (type === 'list') {
                    result = await redis.lrange(key, 0, -1);
                } else if (type === 'set') {
                    result = await redis.smembers(key);
                } else {
                    result = `Unsupported redis type: ${type} or key does not exist`;
                }
            } else if (operation === 'delete') {
                result = { deleted: await redis.del(key) };
            } else if (operation === 'insert' || operation === 'update') {
                if (typeof data === 'object' && data !== null) {
                    result = await redis.hset(key, data);
                } else {
                    result = await redis.set(key, String(data));
                }
            } else {
                throw new Error(`Unsupported Redis operation: ${operation}. Supported: find (keys), findOne (get), insert/update (set/hset), delete (del)`);
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
