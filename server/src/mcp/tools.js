import mongoose from 'mongoose';
import SupportTicket from '../models/SupportTicket.js';
import DemoRequest from '../models/DemoRequest.js';
import Organization from '../models/Organization.js';
import Message from '../models/Message.js';

export const getMcpTools = () => [
  {
    name: 'read_server_logs',
    description: 'Reads the recent server logs.',
    inputSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'number',
          description: 'Number of lines to read',
          default: 50,
        },
      },
    },
  },
  {
    name: 'manage_tickets',
    description: 'Reads, updates, or creates support tickets.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['read', 'create', 'update'],
          description: 'The action to perform',
        },
        ticketId: {
          type: 'string',
          description: 'ID of the ticket (required for read and update)',
        },
        data: {
          type: 'object',
          description: 'Payload for creating or updating a ticket',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'classgrid_talk',
    description: 'Interact with Classgrid communications.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['send_message', 'read_messages'],
          description: 'Action to perform in Classgrid Talk',
        },
        channelId: {
          type: 'string',
          description: 'The channel or thread ID',
        },
        message: {
          type: 'string',
          description: 'The message content to send',
        },
      },
      required: ['action', 'channelId'],
    },
  },
  {
    name: 'super_admin_provision',
    description: 'Provisions a new demo school or sandbox environment.',
    inputSchema: {
      type: 'object',
      properties: {
        schoolName: {
          type: 'string',
          description: 'Name of the sandbox school to create',
        },
        adminEmail: {
          type: 'string',
          description: 'Email address of the initial admin',
        },
      },
      required: ['schoolName', 'adminEmail'],
    },
  },
  {
    name: 'mongo_query',
    description: 'Executes a direct query against MongoDB collections.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'The name of the MongoDB collection',
        },
        operation: {
          type: 'string',
          enum: ['find', 'findOne', 'updateOne', 'deleteMany', 'countDocuments'],
          description: 'The MongoDB operation to perform',
        },
        query: {
          type: 'object',
          description: 'The JSON query filter',
        },
        update: {
           type: 'object',
           description: 'The update payload (for update operations)',
        }
      },
      required: ['collection', 'operation', 'query'],
    },
  }
];

export const handleToolCall = async (name, args) => {
  console.log(`[MCP Tool Called] ${name}`, args);

  try {
    switch (name) {
      case 'read_server_logs':
        // Mocking log read since file system paths vary wildly between local/EC2/Vercel
        return {
          content: [{ type: 'text', text: `[SYSTEM] Log reading is mocked for security. Please use AWS CloudWatch or PM2 logs for production tracing.` }],
        };

      case 'manage_tickets':
        if (args.action === 'read') {
          if (args.ticketId) {
            const ticket = await SupportTicket.findById(args.ticketId).lean();
            return { content: [{ type: 'text', text: JSON.stringify(ticket, null, 2) }] };
          }
          const tickets = await SupportTicket.find({}).sort({ createdAt: -1 }).limit(10).lean();
          return { content: [{ type: 'text', text: JSON.stringify(tickets, null, 2) }] };
        }
        if (args.action === 'update') {
          const updated = await SupportTicket.findByIdAndUpdate(args.ticketId, args.data, { new: true }).lean();
          return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
        }
        return {
          content: [{ type: 'text', text: `Unsupported ticket action: ${args.action}` }],
        };

      case 'classgrid_talk':
        if (args.action === 'read_messages') {
          const messages = await Message.find({ channelId: args.channelId }).sort({ date: -1 }).limit(20).lean();
          return { content: [{ type: 'text', text: JSON.stringify(messages, null, 2) }] };
        }
        return {
          content: [{ type: 'text', text: `Message action executed for channel: ${args.channelId}` }],
        };

      case 'super_admin_provision':
        // Insert a demo request into the DB to track it
        const demo = new DemoRequest({
           name: args.adminEmail.split('@')[0],
           email: args.adminEmail,
           institution_name: args.schoolName,
           status: 'approved'
        });
        await demo.save();
        return {
          content: [{ type: 'text', text: `Provisioned Sandbox School: ${args.schoolName} for ${args.adminEmail}. Demo Request ID: ${demo._id}` }],
        };

      case 'mongo_query':
        if (!mongoose.connection.db) {
            throw new Error("MongoDB connection not established");
        }
        const collection = mongoose.connection.db.collection(args.collection);
        let result;
        
        if (args.operation === 'find') {
            const docs = await collection.find(args.query).limit(50).toArray();
            result = docs;
        } else if (args.operation === 'findOne') {
            result = await collection.findOne(args.query);
        } else if (args.operation === 'countDocuments') {
            result = { count: await collection.countDocuments(args.query) };
        } else if (args.operation === 'updateOne') {
            result = await collection.updateOne(args.query, { $set: args.update });
        } else if (args.operation === 'deleteMany') {
            result = await collection.deleteMany(args.query);
        } else {
            throw new Error(`Unsupported mongo operation: ${args.operation}`);
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`[MCP Tool Error] ${name}:`, error);
    return {
        isError: true,
        content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }],
    };
  }
};
