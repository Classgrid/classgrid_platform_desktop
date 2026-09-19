/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

import fs from 'fs';
import mongoose from 'mongoose';
import { getChatSb } from '../config/supabaseClient.js';
import redis from '../config/redis.js';
import path from 'path';
import accessLogger from '../config/logger.js';
import { exec } from 'child_process';
import util from 'util';
import { marked } from 'marked';
import { NodeSSH } from 'node-ssh';
import { s3Client, BUCKET_NAME, CDN_BASE_URL } from '../config/s3Client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const execPromise = util.promisify(exec);

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
          enum: ['find', 'findOne', 'insert', 'update', 'delete', 'countDocuments', 'distinct', 'aggregate'],
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
  },
  {
    name: 'run_code',
    description: 'Execute Python or JavaScript code securely in the AWS EC2 Docker Sandbox. Use this for calculations, data analysis, or executing scripts. CRITICAL: DO NOT use this tool to generate PDFs (no ReportLab). ALWAYS use the native generate_pdf tool instead.',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['python', 'javascript', 'bash'], description: 'The programming language or shell.' },
        code: { type: 'string', description: 'The raw code string to execute.' }
      },
      required: ['language', 'code']
    }
  },

  {
    name: 'execute_terminal_command',
    description: 'Executes a native bash/terminal command directly on the host computer. You can use this to run curl, tesseract, Python, or system utilities.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The exact bash/terminal command to execute.' }
      },
      required: ['command']
    }
  },
  {
    name: 'internal_thought_process',
    description: 'REQUIRED UI progress update. You MUST use this tool FIRST on every single message to plan your response, even for simple greetings. DO NOT use it more than once per request.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'A short 3-5 word title of what you are doing (e.g. "Evaluating PDF attachment" or "Querying User Database")' },
        details: { type: 'string', description: 'A 1-2 sentence explanation of your thought process and what you are about to do.' }
      },
      required: ['title', 'details']
    }
  },
  {
    name: 'search_syllabus_vectors',
    description: 'Perform similarity search on the syllabus/material pgvector database in Supabase Postgres.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query.' },
        org_id: { type: 'string', description: 'The organization ID to filter by.' },
        match_threshold: { type: 'number', description: 'Minimum similarity threshold (0.0 to 1.0).' },
        match_count: { type: 'number', description: 'Number of results to return.' }
      },
      required: ['query', 'org_id']
    }
  },
  {
    name: 'vercel_connector',
    description: 'Interact with Vercel API to list projects, deployments, or fetch deployment details.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['list_projects', 'list_deployments', 'get_deployment'], description: 'The Vercel operation to perform.' },
        projectId: { type: 'string', description: 'The Vercel Project ID (required for list_deployments).' },
        limit: { type: 'number', description: 'Max number of results to return (default 10).' },
        deploymentId: { type: 'string', description: 'The Vercel Deployment ID (required for get_deployment).' }
      },
      required: ['operation']
    }
  },
  {
    name: 'google_workspace_connector',
    description: 'Interact with Google Workspace APIs (Calendar, Drive, Classroom, Gmail, Forms) using the connected user token.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['list_events', 'list_drive_files', 'list_emails', 'get_form', 'list_form_responses'], description: 'The operation to perform.' },
        limit: { type: 'number', description: 'Max results to return.' },
        formId: { type: 'string', description: 'The ID of the Google Form (required for get_form and list_form_responses).' }
      },
      required: ['operation']
    }
  },
  {
    name: 'zoom_connector',
    description: 'Interact with Zoom API to list or create meetings using the connected user token.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['list_meetings'], description: 'The operation to perform.' }
      },
      required: ['operation']
    }
  },
  {
    name: 'microsoft_workspace_connector',
    description: 'Interact with Microsoft Workspace APIs (Outlook, Teams) using the connected user token.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['list_emails', 'list_meetings'], description: 'The operation to perform.' },
        limit: { type: 'number', description: 'Max results to return.' }
      },
      required: ['operation']
    }
  },
  {
    name: 'whatsapp_business_connector',
    description: 'Send WhatsApp messages using the official WhatsApp Business API.',
    inputSchema: {
      type: 'object',
      properties: {
        toPhoneNumber: { type: 'string', description: 'The recipient phone number with country code (e.g. 919876543210).' },
        messageText: { type: 'string', description: 'The text message to send.' }
      },
      required: ['toPhoneNumber', 'messageText']
    }
  }
];

export const handleToolCall = async (name, args, context = {}) => {
  const { userEmail = 'unknown@classgrid.in', userRole = '', subdomain = '', sessionId = 'default' } = context;

  try {
    if (name === 'unified_db_query') {
      let { source, collectionOrTable, operation, query = {}, data = {} } = args;
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
          'Lead': 'leads',
          'NotificationLog': 'notificationlogs'
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
          'invoices', 'platformtransactions', 'adminauditlogs',
          'notificationlogs'
        ];

        if (superAdminOnlyCollections.includes(actualCollectionName) && !isSuperAdmin) {
          return {
            content: [{ type: 'text', text: `SECURITY ERROR: Access Denied. Database firewall blocked role '${userRole}' from accessing restricted collection '${actualCollectionName}'.` }]
          };
        }

        const collection = mongoose.connection.db.collection(actualCollectionName);
        
        if (actualCollectionName === 'users' && query) {
            // No auto-correction for org_admin needed; the schema strictly uses org_admin.
        }
        
        let result;

        if (operation === 'find') {
          if (actualCollectionName === 'users') {
            result = await collection.aggregate([
              { $match: query || {} },
              { $limit: 50 },
              {
                $addFields: {
                  orgObjId: { $convert: { input: "$organization_id", to: "objectId", onError: null, onNull: null } }
                }
              },
              {
                $lookup: {
                  from: 'organizations',
                  localField: 'orgObjId',
                  foreignField: '_id',
                  as: 'organization_details'
                }
              }
            ]).toArray();
          } else {
            result = await collection.find(query).limit(50).toArray();
          }
        } else if (operation === 'findOne') {
          result = await collection.findOne(query);
        } else if (operation === 'countDocuments') {
          result = { count: await collection.countDocuments(query) };
        } else if (operation === 'distinct') {
          const field = data?.field || query?.field || 'role';
          const filter = query?.filter || (query?.field ? {} : query);
          result = await collection.distinct(field, filter);
        } else if (operation === 'aggregate') {
          const pipeline = Array.isArray(query) ? query : (Array.isArray(data) ? data : data?.pipeline || query?.pipeline || []);
          result = await collection.aggregate(pipeline).toArray();
        } else if (operation === 'update') {
          result = await collection.updateMany(query, { $set: data });
        } else if (operation === 'insert') {
          result = await collection.insertMany(Array.isArray(data) ? data : [data]);
        } else if (operation === 'delete') {
          result = await collection.deleteMany(query);
        } else {
          throw new Error(`Unsupported MongoDB operation: ${operation}`);
        }

        // 🚨 AI TOKEN OVERFLOW PROTECTION 🚨
        const aiSafetyReplacer = (key, value) => {
          const forbiddenKeys = [
            'password', 'profilePicture', 'profileBanner', 'logo', 'favicon', 'signature', 
            'activationToken', 'resetPasswordToken', 'payroll_config', 'preferences', 'settings',
            'fee_structures', 'modules', 'theme', 'audit_logs', 'history', 'metadata', 'permissions'
          ];
          if (forbiddenKeys.includes(key)) return undefined;
          
          if (typeof value === 'string' && value.length > 500) return "[TRUNCATED HUGE STRING]";
          
          // Aggressive list protection: If we are returning a list of documents, strip out any nested arrays to prevent context overflow!
          if (key !== "" && Array.isArray(value) && value.length > 3 && Array.isArray(result) && result.length > 2) {
             return `[Array of ${value.length} items TRUNCATED to save context]`;
          }
          
          return value;
        };

        let outputText = JSON.stringify(result, aiSafetyReplacer, 2);
        if (Array.isArray(result) && result.length > 2) {
          outputText += `\n\n[SYSTEM DIRECTIVE TO AI: The database returned EXACTLY ${result.length} items. YOU ARE STRICTLY FORBIDDEN from truncating this list in your response to the user. You MUST transcribe ALL ${result.length} items. Do not stop early. Do not summarize.]`;
        }

        return {
          content: [{ type: 'text', text: outputText }],
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

        const aiSafetyReplacer = (key, value) => {
          const forbiddenKeys = ['password', 'profilePicture', 'profileBanner', 'logo', 'favicon', 'signature', 'activationToken', 'resetPasswordToken', 'payroll_config', 'preferences', 'settings', 'fee_structures', 'modules', 'theme', 'audit_logs', 'history', 'metadata', 'permissions'];
          if (forbiddenKeys.includes(key)) return undefined;
          if (typeof value === 'string' && value.length > 500) return "[TRUNCATED HUGE STRING]";
          if (key !== "" && Array.isArray(value) && value.length > 3 && Array.isArray(result) && result.length > 2) {
             return `[Array of ${value.length} items TRUNCATED to save context]`;
          }
          return value;
        };

        let outputText = JSON.stringify(result, aiSafetyReplacer, 2);
        if (Array.isArray(result) && result.length > 2) {
          outputText += `\n\n[SYSTEM DIRECTIVE TO AI: The database returned EXACTLY ${result.length} items. YOU ARE STRICTLY FORBIDDEN from truncating this list in your response to the user. You MUST transcribe ALL ${result.length} items. Do not stop early. Do not summarize.]`;
        }

        return {
          content: [{ type: 'text', text: outputText }],
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

    if (name === 'internal_thought_process') {
      const { title, details } = args;
      console.log(`\n🧠 [THOUGHT] ${title}: ${details}`);
      return {
        content: [{ type: 'text', text: `Thought recorded successfully. Proceed with your next action.` }]
      };
    }

    if (name === 'execute_terminal_command') {
      let command = args?.command || '';
      const { sessionId = 'default', userEmail = 'unknown' } = context;

      console.log(`\n=================================================`);
      console.log(`🚀 [SANDBOX TERMINAL ACTION STARTED]`);
      console.log(`👤 User: ${userEmail} | 🆔 Session: ${sessionId}`);
      console.log(`💻 Command:\n${command}`);
      console.log(`=================================================\n`);
      fs.appendFileSync('ai_commands.log', `[${new Date().toISOString()}] COMMAND: ${command}\n`);

      accessLogger.info("Sandbox Terminal Action Started", {
        action: "sandbox_terminal_start",
        sessionId,
        userEmail,
        command
      });

      if (command.match(/python3?\s+-c/i)) {
          // Allow inline python for OCR scripts to be executed directly in the terminal
      }

      try {
        const ssh = new NodeSSH();
        const isProd = process.env.NODE_ENV === 'production';
        await ssh.connect({
          host: isProd ? '172.31.6.98' : '13.63.34.197', // Private IP for prod, Public IP for local testing
          username: 'ubuntu',
          ...(process.env.AGENT_SSH_KEY
            ? { privateKey: process.env.AGENT_SSH_KEY.replace(/\\n/g, '\n') }
            : { privateKeyPath: 'C:\\Users\\nikhi\\Downloads\\Nikhil.pem' })
        });

        console.log(`[Sandbox] Connected! Executing command safely...`);

        const { sessionId = 'default' } = context;

        // This is the Notion AI magic: 
        // 1. Spins up isolated container
        // 2. Runs the exact command inside
        // 3. Destroys the container instantly (--rm)
        // We use -v to mount a shared /data folder specific to this chat session!
        const scriptPath = `/home/ubuntu/sandbox_data/${sessionId}/script.sh`;

        const writeCommand = `mkdir -p /home/ubuntu/sandbox_data/${sessionId} && cat << 'EOF_SCRIPT' > ${scriptPath}\n${command}\nEOF_SCRIPT`;
        await ssh.execCommand(writeCommand);

        const envVars = ` -e AWS_ACCESS_KEY_ID="${process.env.AWS_ACCESS_KEY_ID || ''}" -e AWS_SECRET_ACCESS_KEY="${process.env.AWS_SECRET_ACCESS_KEY || ''}" -e AWS_S3_REGION="${process.env.AWS_S3_REGION || ''}" -e AWS_S3_BUCKET="${process.env.AWS_S3_BUCKET || ''}" -e R2_ACCOUNT_ID="${process.env.R2_ACCOUNT_ID || ''}" -e R2_ACCESS_KEY_ID="${process.env.R2_ACCESS_KEY_ID || ''}" -e R2_SECRET_ACCESS_KEY="${process.env.R2_SECRET_ACCESS_KEY || ''}" -e R2_BUCKET_NAME="${process.env.R2_BUCKET_NAME || 'classgrid-storage'}" -e R2_PUBLIC_URL="${process.env.R2_PUBLIC_URL || 'https://pub-96a564393c0440f2bab37ad8bbe92398.r2.dev'}" -e AWS_SES_SMTP_HOST="${process.env.AWS_SES_SMTP_HOST || ''}" -e AWS_SES_SMTP_USER="${process.env.AWS_SES_SMTP_USER || ''}" -e AWS_SES_SMTP_PASS="${process.env.AWS_SES_SMTP_PASS || ''}" `;

        console.log(`[Sandbox] Securely injecting credentials and running Docker container for terminal command...`);
        const dockerCommand = `docker run --rm ${envVars} -v /home/ubuntu/sandbox_data/${sessionId}:/data my-agent-sandbox bash /data/script.sh`;
        const result = await ssh.execCommand(dockerCommand);

        console.log(`\n=================================================`);
        console.log(`✅ [SANDBOX TERMINAL ACTION FINISHED]`);
        console.log(`🟢 STDOUT:\n${result.stdout}`);
        if (result.stderr) console.log(`🔴 STDERR:\n${result.stderr}`);
        console.log(`=================================================\n`);

        accessLogger.info("Sandbox Terminal Action Finished", {
          action: "sandbox_terminal_end",
          sessionId,
          userEmail,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code
        });

        ssh.dispose();

        return {
          content: [{ type: 'text', text: `Command executed in isolated Sandbox.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}` }]
        };
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Sandbox Error: ${e.message}` }]
        };
      }
    }

    if (name === 'run_code') {
      const { language, code } = args;
      const { sessionId = 'default', userEmail = 'unknown' } = context;

      console.log(`\n=================================================`);
      console.log(`🚀 [SANDBOX CODE EXECUTION STARTED]`);
      console.log(`👤 User: ${userEmail} | 🆔 Session: ${sessionId}`);
      console.log(`💻 Language: ${language}`);
      console.log(`📝 Code Payload:\n${code}`);
      console.log(`=================================================\n`);

      accessLogger.info("Sandbox Code Execution Started", {
        action: "sandbox_code_start",
        sessionId,
        userEmail,
        language,
        codeSnippetPreview: code.substring(0, 500)
      });

      try {
        // Native send_email reserves an idempotency key before SES. Generated SMTP
        // scripts would bypass that guard and can create duplicate messages.
        if (/\b(smtplib|nodemailer|sendMail|send_message|AWS_SES_SMTP_)\b/i.test(code)) {
          return { content: [{ type: 'text', text: 'EMAIL_ACTION_BLOCKED: Use send_email for external email delivery; it is the only idempotent email path.' }] };
        }
        const ssh = new NodeSSH();
        const isProd = process.env.NODE_ENV === 'production';
        await ssh.connect({
          host: isProd ? '172.31.6.98' : '13.63.34.197', // Private IP for prod, Public IP for local testing
          username: 'ubuntu',
          ...(process.env.AGENT_SSH_KEY
            ? { privateKey: process.env.AGENT_SSH_KEY.replace(/\\n/g, '\n') }
            : { privateKeyPath: 'C:\\Users\\nikhi\\Downloads\\Nikhil.pem' })
        });

        const { sessionId = 'default' } = context;

        // Instead of inline execution (which causes newline escape issues),
        // we will write the code to a file in the shared /data folder and execute it.
        let ext = '';
        let execCmd = '';

        if (language === 'python') { ext = 'py'; execCmd = 'python3'; }
        else if (language === 'javascript') { ext = 'js'; execCmd = 'node'; }
        else if (language === 'bash') { ext = 'sh'; execCmd = 'bash'; }
        else throw new Error("Unsupported language. Use python, javascript, or bash.");

        // Create the directory on the host, write the file from the code string (using a heredoc to preserve exact contents),
        // and then run the docker container which maps that directory to /data and executes the file.
        const scriptPath = `/home/ubuntu/sandbox_data/${sessionId}/script.${ext}`;

        // We use EOF heredoc to safely write the script without quote escaping issues
        const writeCommand = `mkdir -p /home/ubuntu/sandbox_data/${sessionId} && cat << 'EOF_SCRIPT' > ${scriptPath}\n${code}\nEOF_SCRIPT`;
        await ssh.execCommand(writeCommand);

        const envVars = ` -e AWS_ACCESS_KEY_ID="${process.env.AWS_ACCESS_KEY_ID || ''}" -e AWS_SECRET_ACCESS_KEY="${process.env.AWS_SECRET_ACCESS_KEY || ''}" -e AWS_S3_REGION="${process.env.AWS_S3_REGION || ''}" -e AWS_S3_BUCKET="${process.env.AWS_S3_BUCKET || ''}" -e AWS_S3_ERP_ACCESS_KEY="${process.env.AWS_S3_ERP_ACCESS_KEY || ''}" -e AWS_S3_ERP_SECRET_KEY="${process.env.AWS_S3_ERP_SECRET_KEY || ''}" -e AWS_S3_ERP_REGION="${process.env.AWS_S3_ERP_REGION || ''}" -e AWS_S3_ERP_BUCKET_NAME="${process.env.AWS_S3_ERP_BUCKET_NAME || ''}" -e AWS_CLOUDFRONT_ERP_DOMAIN="${process.env.AWS_CLOUDFRONT_ERP_DOMAIN || ''}" -e R2_ACCOUNT_ID="${process.env.R2_ACCOUNT_ID || ''}" -e R2_ACCESS_KEY_ID="${process.env.R2_ACCESS_KEY_ID || ''}" -e R2_SECRET_ACCESS_KEY="${process.env.R2_SECRET_ACCESS_KEY || ''}" -e R2_BUCKET_NAME="${process.env.R2_BUCKET_NAME || 'classgrid-storage'}" -e R2_PUBLIC_URL="${process.env.R2_PUBLIC_URL || 'https://pub-96a564393c0440f2bab37ad8bbe92398.r2.dev'}" -e AWS_SES_SMTP_HOST="${process.env.AWS_SES_SMTP_HOST || ''}" -e AWS_SES_SMTP_USER="${process.env.AWS_SES_SMTP_USER || ''}" -e AWS_SES_SMTP_PASS="${process.env.AWS_SES_SMTP_PASS || ''}" `;

        console.log(`[Sandbox] Securely injecting credentials and running Docker container for ${language} script...`);
        const dockerCommand = `docker run --rm ${envVars} -v /home/ubuntu/sandbox_data/${sessionId}:/data my-agent-sandbox ${execCmd} /data/script.${ext}`;
        const result = await ssh.execCommand(dockerCommand);

        console.log(`\n=================================================`);
        console.log(`✅ [SANDBOX CODE EXECUTION FINISHED]`);
        console.log(`🟢 STDOUT:\n${result.stdout}`);
        if (result.stderr) console.log(`🔴 STDERR:\n${result.stderr}`);
        console.log(`=================================================\n`);

        accessLogger.info("Sandbox Code Execution Finished", {
          action: "sandbox_code_end",
          sessionId,
          userEmail,
          language,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.code
        });

        ssh.dispose();

        return {
          content: [{ type: 'text', text: `[Sandbox Execution Results]\n\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}` }],
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to connect to AWS Sandbox: ${e.message}` }] };
      }
    }

    if (name === 'generate_pdf') {
      let { content = '', title, rawData } = args;

      console.log(`\n📄 [AWS NATIVE] AI is generating a REAL PDF document securely using Puppeteer!`);

      try {
        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
          const keys = Object.keys(rawData[0]).filter(k => typeof rawData[0][k] !== 'object' && k !== '_id' && k !== 'password');
          let tableHtml = `<table><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
          for (const row of rawData) {
            tableHtml += `<tr>${keys.map(k => `<td>${row[k] || ''}</td>`).join('')}</tr>`;
          }
          tableHtml += `</table>`;
          content += tableHtml;
        }

        // Launch native headless browser to render true PDF
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Inject content. Wrap in basic HTML if it doesn't have it.
        const finalHtml = content.includes('<!DOCTYPE html>') ? content : `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title || 'Document'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                        h1 { color: #3eaf28; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    ${title ? `<h1>${title}</h1>` : ''}
                    ${content}
                </body>
                </html>
            `;

        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });

        // Generate the PDF buffer
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        await browser.close();

        const fileName = `${title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'generated_' + Date.now()}.pdf`;

        // Upload directly to AWS S3 so the CDN link works
        const s3Key = `reports/${fileName}`;
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
          ACL: 'public-read'
        }));

        const cdnUrl = `${CDN_BASE_URL}/${s3Key}`;
        return {
          content: [{ type: 'text', text: `SUCCESS! PDF generated and uploaded to AWS CDN.\nCDN Download URL: ${cdnUrl}` }],
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to generate PDF via Puppeteer: ${e.message}` }] };
      }
    }

    if (name === 'generate_pdf_from_db') {
      const { source, collectionOrTable, query, title, htmlTemplate } = args;
      try {
        console.log(`\n📄 [AWS NATIVE] AI is directly fetching data and using Handlebars to bypass token limits!`);
        let result;
        if (source === 'mongodb') {
          const collectionName = collectionOrTable.toLowerCase() === 'user' ? 'users' : collectionOrTable;
          const collection = mongoose.connection.collection(collectionName);
          if (collectionName === 'users') {
            result = await collection.aggregate([
              { $match: query },
              { $limit: 1000 },
              { $addFields: { orgObjId: { $convert: { input: "$organization_id", to: "objectId", onError: null, onNull: null } } } },
              { $lookup: { from: "organizations", localField: "orgObjId", foreignField: "_id", as: "organization_details" } },
              { $project: { orgObjId: 0 } }
            ]).toArray();
          } else {
            result = await collection.find(query).limit(1000).toArray();
          }
        } else {
          return { content: [{ type: 'text', text: 'generate_pdf_from_db only supports mongodb right now.' }] };
        }

        if (!result || result.length === 0) {
          return { content: [{ type: 'text', text: 'No data found for the given query.' }] };
        }

        let finalHtml;
        if (htmlTemplate) {
          const template = Handlebars.compile(htmlTemplate);
          finalHtml = template({ rows: result, title });
        } else {
          const keys = Object.keys(result[0]).filter(k => typeof result[0][k] !== 'object' && k !== '_id' && k !== 'password');
          let tableHtml = `<table><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
          for (const row of result) {
            tableHtml += `<tr>${keys.map(k => `<td>${row[k] || ''}</td>`).join('')}</tr>`;
          }
          tableHtml += `</table>`;

          const defaultCss = `
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1a1a1a; background-color: #f9fafb; }
                    h1 { color: #111827; text-align: center; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
                    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; font-size: 13px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                    th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
                    tr:last-child td { border-bottom: none; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                `;

          finalHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${title || 'Report'}</title>
                        <style>${defaultCss}</style>
                    </head>
                    <body>
                        <h1>${title} (Total: ${result.length})</h1>
                        ${tableHtml}
                    </body>
                    </html>
                `;
        }

        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } });
        await browser.close();

        const fileName = `${title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'db_report_' + Date.now()}.pdf`;
        const s3Key = `reports/${fileName}`;
        await s3Client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key, Body: pdfBuffer, ContentType: 'application/pdf', ACL: 'public-read' }));

        const cdnUrl = `${CDN_BASE_URL}/${s3Key}`;
        return {
          content: [{ type: 'text', text: `SUCCESS! Fetched ${result.length} items directly from DB and generated PDF.\nCDN Download URL: ${cdnUrl}` }],
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed: ${e.message}` }] };
      }
    }


    if (name === 'search_syllabus_vectors') {
      try {
        const { query, org_id, match_threshold = 0.7, match_count = 5 } = args;
        
        if (!process.env.VOYAGE_API_KEY) {
          return { content: [{ type: 'text', text: 'Error: VOYAGE_API_KEY is not set in environment variables.' }] };
        }

        // Using MongoDB's unified Atlas AI API to bypass the legacy Voyage 3 RPM rate limit 
        // and utilize the Startup Credits directly!
        const voyageRes = await fetch("https://ai.mongodb.com/v1/embeddings", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${process.env.VOYAGE_API_KEY.trim()}` 
          },
          body: JSON.stringify({
            input: query,
            model: "voyage-3-large" 
          })
        });

        if (!voyageRes.ok) {
           const errText = await voyageRes.text();
           throw new Error(`Voyage AI (Atlas) error: ${errText}`);
        }

        const embeddingResponse = await voyageRes.json();
        const query_embedding = embeddingResponse.data[0].embedding;

        const sb = getChatSb();
        const { data, error } = await sb.rpc('match_syllabus_chunks', {
          query_embedding,
          match_threshold,
          match_count,
          p_org_id: org_id
        });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          return { content: [{ type: 'text', text: 'No relevant syllabus matches found for this query.' }] };
        }

        const formattedResults = data.map((chunk, index) => 
          `[Match ${index + 1}] (Similarity: ${chunk.similarity.toFixed(2)})\n${chunk.content}`
        ).join('\n\n---\n\n');

        return {
          content: [{ type: 'text', text: `Found ${data.length} matches:\n\n${formattedResults}` }]
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to search syllabus vectors: ${e.message}` }] };
      }
    }

    if (name === 'vercel_connector') {
      const { operation, projectId, limit = 10, deploymentId } = args;
      const { userEmail = '', userRole = '' } = context;
      const isSuperAdmin = userEmail.endsWith('@classgrid.in') || userRole === 'super_admin';

      if (!isSuperAdmin) {
        return {
          content: [{ type: 'text', text: `SECURITY ERROR: Access Denied. Only super_admins can access the Vercel API.` }]
        };
      }

      // Fetch the OAuth token from the database
      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || !user.vercel_access_token) {
        return {
          content: [{ type: 'text', text: `Error: No Vercel OAuth token found. Please connect your Vercel account from the settings page first.` }]
        };
      }
      const vercelToken = user.vercel_access_token;

      try {
        let endpoint = '';
        if (operation === 'list_projects') {
          endpoint = `/v9/projects?limit=${limit}`;
        } else if (operation === 'list_deployments') {
          if (!projectId) throw new Error("projectId is required for list_deployments");
          endpoint = `/v6/deployments?projectId=${projectId}&limit=${limit}`;
        } else if (operation === 'get_deployment') {
          if (!deploymentId) throw new Error("deploymentId is required for get_deployment");
          endpoint = `/v13/deployments/${deploymentId}`;
        } else {
          throw new Error(`Unsupported Vercel operation: ${operation}`);
        }

        const response = await fetch(`https://api.vercel.com${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Vercel API error (${response.status}): ${errText}`);
        }

        const data = await response.json();

        // 🚨 AI TOKEN OVERFLOW PROTECTION 🚨
        const aiSafetyReplacer = (key, value) => {
          const forbiddenKeys = ['source', 'env', 'builds', 'routes', 'meta'];
          if (forbiddenKeys.includes(key)) return undefined;
          if (typeof value === 'string' && value.length > 500) return "[TRUNCATED HUGE STRING]";
          return value;
        };

        const outputText = JSON.stringify(data, aiSafetyReplacer, 2);

        return {
          content: [{ type: 'text', text: outputText }]
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Vercel API call: ${e.message}` }] };
      }
    }

    if (name === 'google_workspace_connector') {
      const { operation, limit = 10 } = args;
      const { userEmail = '' } = context;

      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || (!user.google_access_token && !user.google_refresh_token)) {
        return { content: [{ type: 'text', text: `Error: No Google Workspace connection found. Please connect your Google account first.` }] };
      }

      try {
        const { google } = await import('googleapis');
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.BACKEND_URL}/api/google-workspace/callback`
        );
        oauth2Client.setCredentials({
            access_token: user.google_access_token,
            refresh_token: user.google_refresh_token,
            expiry_date: user.google_token_expiry ? user.google_token_expiry.getTime() : null
        });

        let data = {};
        if (operation === 'list_events') {
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: limit,
            singleEvents: true,
            orderBy: 'startTime',
          });
          data = res.data.items;
        } else if (operation === 'list_drive_files') {
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const res = await drive.files.list({
            pageSize: limit,
            fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
          });
          data = res.data.files;
        } else if (operation === 'list_emails') {
          const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
          const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: limit,
            q: 'is:unread'
          });
          const messages = res.data.messages || [];
          data = [];
          for (let m of messages) {
            const msg = await gmail.users.messages.get({ userId: 'me', id: m.id });
            const headers = msg.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value;
            const from = headers.find(h => h.name === 'From')?.value;
            data.push({ id: msg.data.id, snippet: msg.data.snippet, subject, from });
          }
        } else if (operation === 'get_form') {
          if (!args.formId) throw new Error("formId is required for get_form");
          const forms = google.forms({ version: 'v1', auth: oauth2Client });
          const res = await forms.forms.get({ formId: args.formId });
          data = res.data;
        } else if (operation === 'list_form_responses') {
          if (!args.formId) throw new Error("formId is required for list_form_responses");
          const forms = google.forms({ version: 'v1', auth: oauth2Client });
          const res = await forms.forms.responses.list({ formId: args.formId });
          data = res.data.responses || [];
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }

        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Google API call: ${e.message}` }] };
      }
    }

    if (name === 'zoom_connector') {
      const { operation } = args;
      const { userEmail = '' } = context;

      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || (!user.zoom_access_token && !user.zoom_refresh_token)) {
        return { content: [{ type: 'text', text: `Error: No Zoom connection found. Please connect your Zoom account first.` }] };
      }

      try {
        let accessToken = user.zoom_access_token;
        if (user.zoom_token_expiry && new Date(user.zoom_token_expiry.getTime() - 5 * 60000) < new Date()) {
          const tokenResponse = await fetch("https://zoom.us/oauth/token", {
              method: "POST",
              headers: {
                  "Authorization": `Basic ${Buffer.from(process.env.ZOOM_CLIENT_ID + ':' + process.env.ZOOM_CLIENT_SECRET).toString('base64')}`,
                  "Content-Type": "application/x-www-form-urlencoded"
              },
              body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: user.zoom_refresh_token })
          });
          const tokenData = await tokenResponse.json();
          if (tokenData.error) throw new Error("Zoom token expired");
          user.zoom_access_token = tokenData.access_token;
          user.zoom_refresh_token = tokenData.refresh_token; 
          user.zoom_token_expiry = new Date(Date.now() + tokenData.expires_in * 1000);
          await user.save();
          accessToken = user.zoom_access_token;
        }

        if (operation === 'list_meetings') {
          const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(data.meetings, null, 2) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Zoom API call: ${e.message}` }] };
      }
    }

    if (name === 'microsoft_workspace_connector') {
      const { operation, limit = 10 } = args;
      const { userEmail = '' } = context;

      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || (!user.microsoft_access_token && !user.microsoft_refresh_token)) {
        return { content: [{ type: 'text', text: `Error: No Microsoft connection found. Please connect your Microsoft account first.` }] };
      }

      try {
        let accessToken = user.microsoft_access_token;
        if (user.microsoft_token_expiry && new Date(user.microsoft_token_expiry.getTime() - 5 * 60000) < new Date()) {
          const tokenResponse = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                  client_id: process.env.MICROSOFT_CLIENT_ID,
                  client_secret: process.env.MICROSOFT_CLIENT_SECRET,
                  refresh_token: user.microsoft_refresh_token,
                  grant_type: 'refresh_token'
              })
          });
          const tokenData = await tokenResponse.json();
          if (tokenData.error) throw new Error("Microsoft token expired");
          user.microsoft_access_token = tokenData.access_token;
          if (tokenData.refresh_token) user.microsoft_refresh_token = tokenData.refresh_token; 
          user.microsoft_token_expiry = new Date(Date.now() + tokenData.expires_in * 1000);
          await user.save();
          accessToken = user.microsoft_access_token;
        }

        if (operation === 'list_emails') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$filter=isRead eq false`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'list_meetings') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings?$top=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Microsoft API call: ${e.message}` }] };
      }
    }

    if (name === 'whatsapp_business_connector') {
      const { toPhoneNumber, messageText } = args;
      try {
        if (!process.env.WHATSAPP_PHONE_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
          throw new Error("WhatsApp Business API keys are not configured in the backend environment.");
        }

        const res = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: toPhoneNumber,
            type: "text",
            text: {
              preview_url: false,
              body: messageText
            }
          })
        });

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error.message);
        }

        return { content: [{ type: 'text', text: `WhatsApp message sent successfully to ${toPhoneNumber}. Message ID: ${data.messages[0].id}` }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to send WhatsApp message: ${e.message}` }] };
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
