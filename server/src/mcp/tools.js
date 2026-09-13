import mongoose from 'mongoose';
import { getChatSb } from '../config/supabaseClient.js';
import redis from '../config/redis.js';
import path from 'path';
import { sendEmail } from '../services/aws-ses.service.js';
import { s3Client, BUCKET_NAME, CDN_BASE_URL } from '../config/s3Client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { exec } from 'child_process';
import util from 'util';
import { marked } from 'marked';
import { NodeSSH } from 'node-ssh';

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
    description: 'Execute Python or JavaScript code securely in the Cloudflare AI Sandbox. Use this for calculations, data analysis, or executing scripts.',
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
    name: 'generate_pdf',
    description: 'Generates a PDF document from HTML or raw data. If you have a large list of data, pass the JSON array into `rawData` instead of writing a giant HTML table, and the backend will format it for you.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Optional HTML or Markdown content.' },
        title: { type: 'string', description: 'The title of the PDF document.' },
        rawData: { type: 'array', items: { type: 'object' }, description: 'Optional JSON array of data. Use this for large lists instead of formatting HTML manually.' }
      }
    }
  },
  {
    name: 'generate_pdf_from_db',
    description: 'Generates a PDF document by directly querying the database and formatting the results. Use this tool for HUGE data dumps (e.g. "Fetch all 600 students") to completely bypass your token memory limits. You just provide the query, and the backend does everything.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['mongodb', 'supabase'], description: 'The database source' },
        collectionOrTable: { type: 'string', description: 'The collection or table name' },
        query: { type: 'object', description: 'The database query (e.g. { role: "student" })' },
        title: { type: 'string', description: 'The title of the PDF document.' },
        htmlTemplate: { type: 'string', description: 'Optional Handlebars HTML template. Use {{#each rows}} ... {{/each}} to loop over the data. You have 100% control over the CSS and HTML structure.' }
      },
      required: ['source', 'collectionOrTable', 'query', 'title']
    }
  },
  {
    name: 'send_email',
    description: 'Sends an email to a specified recipient using AWS SES. Use this to send reports, PDFs, or notifications directly from the chat.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'The recipient email address.' },
        subject: { type: 'string', description: 'The subject of the email.' },
        body: { type: 'string', description: 'REQUIRED: A fully formed, beautiful HTML string containing the email body. You MUST write raw HTML with inline CSS for styling (e.g., modern fonts, padding, colors). DO NOT use Markdown.' },
        attachments: {
          type: 'array',
          description: 'Optional. A list of files to attach to the email. Each item MUST have a "filename" and EITHER "path" (a valid URL) OR "content" (base64 string).',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string', description: 'Name of the attached file (e.g. report.pdf)' },
              path: { type: 'string', description: 'Direct public URL to the file to attach (e.g. a CDN link).' },
              content: { type: 'string', description: 'Raw base64 string of the file content.' }
            }
          }
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'upload_file_to_cdn',
    description: 'Uploads a base64 encoded file to the Classgrid R2 CDN and returns a public URL. Use this to share files you generated (like Excel, CSV, PDF) with the user in the chat.',
    inputSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', description: 'The name of the file, including extension (e.g. data.csv, report.xlsx)' },
        base64Content: { type: 'string', description: 'The raw base64 encoded string of the file content (WITHOUT the data prefix).' },
        mimeType: { type: 'string', description: 'The MIME type of the file (e.g. text/csv, application/pdf)' }
      },
      required: ['fileName', 'base64Content', 'mimeType']
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
    name: 'parse_document',
    description: 'Downloads a file (PDF or Image) from a URL and extracts all text from it. Use this tool IMMEDIATELY to read any attached user files.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The direct URL of the file to parse' },
        mimeType: { type: 'string', description: 'The MIME type (e.g. application/pdf, image/png, image/jpeg)' }
      },
      required: ['url', 'mimeType']
    }
  },
  {
    name: 'internal_thought',
    description: 'Use this tool BEFORE taking any action (like running code, uploading a file, or querying the DB) to explain your reasoning to the user. This builds trust and transparency.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'A short 3-5 word title of what you are doing (e.g. "Evaluating PDF attachment" or "Querying User Database")' },
        details: { type: 'string', description: 'A 1-2 sentence explanation of your thought process and what you are about to do.' }
      },
      required: ['title', 'details']
    }
  }
];

export const handleToolCall = async (name, args, context = {}) => {
  const { userEmail = 'unknown@classgrid.in', userRole = '', subdomain = '', sessionId = 'default' } = context;

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
          if (actualCollectionName === 'users') {
            result = await collection.aggregate([
              { $match: query },
              { $limit: 1000 },
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
                },
                { $project: { _id: 1, name: 1, email: 1, role: 1, phone: 1, organization_id: 1, "organization_details.name": 1 } }
            ]).toArray();
          } else {
            result = await collection.find(query).limit(1000).toArray();
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
        // We use a custom stringify replacer to strip out massive useless fields (like passwords, base64 images, tokens, etc.)
        // across ALL collections. This prevents the LLM from hitting its 2000 token limit and truncating the output to 1-2 items!
        const aiSafetyReplacer = (key, value) => {
            const forbiddenKeys = ['password', 'profilePicture', 'profileBanner', 'logo', 'favicon', 'signature', 'activationToken', 'resetPasswordToken', 'payroll_config', 'preferences', 'settings'];
            if (forbiddenKeys.includes(key)) return undefined;
            // Also truncate any ridiculously long string that might be a base64 image or giant HTML block
            if (typeof value === 'string' && value.length > 500) return "[TRUNCATED HUGE STRING]";
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
          let sbQuery = sb.from(collectionOrTable).select('*').match(query).limit(operation === 'findOne' ? 1 : 1000);
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

        let outputText = JSON.stringify(result, null, 2);
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

    if (name === 'internal_thought') {
        const { title, details } = args;
        console.log(`\n🧠 [THOUGHT] ${title}: ${details}`);
        return {
            content: [{ type: 'text', text: `Thought recorded successfully. Proceed with your next action.` }]
        };
    }

    if (name === 'execute_terminal_command') {
        const { command } = args;
        console.log(`\n⚠️ [TERMINAL ACCESS] AI is spinning up Temporary Computer on AWS Sandbox...`);
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

            const dockerCommand = `docker run --rm -v /home/ubuntu/sandbox_data/${sessionId}:/data my-agent-sandbox bash /data/script.sh`;
            const result = await ssh.execCommand(dockerCommand);
            
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
        
        console.log(`\n🚀 [AWS SANDBOX] AI is executing ${language} code securely inside the Temporary Computer!`);
        
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

            const dockerCommand = `docker run --rm -v /home/ubuntu/sandbox_data/${sessionId}:/data my-agent-sandbox ${execCmd} /data/script.${ext}`;
            const result = await ssh.execCommand(dockerCommand);
            
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
                ContentType: 'application/pdf'
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
            await s3Client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key, Body: pdfBuffer, ContentType: 'application/pdf' }));
            
            const cdnUrl = `${CDN_BASE_URL}/${s3Key}`;
            return {
                content: [{ type: 'text', text: `SUCCESS! Fetched ${result.length} items directly from DB and generated PDF.\nCDN Download URL: ${cdnUrl}` }],
            };
        } catch (e) {
            return { content: [{ type: 'text', text: `Failed: ${e.message}` }] };
        }
    }

    if (name === 'send_email') {
        const { to, subject, body } = args;
        console.log(`\n📧 [AWS SES] AI is sending an email to ${to}`);
        try {
            await sendEmail({
                to,
                subject,
                html: body,
                text: body.replace(/<[^>]*>?/gm, ''), // fallback plain text
                fromName: 'Classgrid Team'
            });
            return {
                content: [{ type: 'text', text: `SUCCESS! Email successfully sent to ${to}.` }]
            };
        } catch (e) {
            return { content: [{ type: 'text', text: `Failed to send email via AWS SES: ${e.message}` }] };
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
