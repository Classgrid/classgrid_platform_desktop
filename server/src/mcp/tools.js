/*
 * =========================================================================================
 * ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ CRITICAL AI & SYSTEM RULE ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨
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
import { SESClient, GetSendStatisticsCommand, ListIdentitiesCommand } from '@aws-sdk/client-ses';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { uploadBufferToR2 } from '../config/r2Client.js';
import { Readable } from 'stream';

const execPromise = util.promisify(exec);

export const getMcpTools = () => [
  {
    name: 'unified_db_query',
    description: `Executes a query against MongoDB or Supabase. MANDATORY RULES:
1. You MUST ALWAYS provide the 'fields' parameter with ONLY the specific fields you need (e.g. ["name", "email"]). NEVER request all fields.
2. For a single item, use operation='findOne'. For lists, use operation='find'.
3. QUERY EXAMPLES:
   - "Tell me org name" → source="mongodb", collectionOrTable="Organization", operation="findOne", query={}, fields=["name"]
   - "List all students" → source="mongodb", collectionOrTable="User", operation="find", query={"role":"student"}, fields=["name","email"], limit=20
   - "Who are the org admins?" → source="mongodb", collectionOrTable="User", operation="find", query={"role":"org_admin"}, fields=["name","email","organization_id"], limit=20
   - "How many users?" → source="mongodb", collectionOrTable="User", operation="countDocuments", query={}
4. NEVER request more than 20 items unless the user explicitly asks for all.
5. Keep queries minimal. If the user asks for a name, only request ["name"]. Do NOT request the entire document.`,
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
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'REQUIRED: Array of specific field names to return (e.g. ["name", "email"]). You MUST always specify this. Never omit it.'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of documents to return for find operations. Default is 20. Max is 500.'
        }
      },
      required: ['source', 'collectionOrTable', 'operation', 'fields'],
    },
  },
  {
    name: 'generate_image',
    description: 'Generates a photorealistic AI image based on a prompt. Use this whenever the user asks to create an image, poster, drawing, graphic, or visualization. Do NOT ask the user to type @Create image; just use this tool directly.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The highly detailed prompt for the image to generate.' }
      },
      required: ['prompt']
    }
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
    name: 'manage_rag_document',
    description: 'Create, read, update, delete, or list documents in the Platform RAG Knowledge Base. When creating or updating, text is vectorized using Voyage AI and stored in MongoDB.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'One of: create, read, update, delete, list' },
        id: { type: 'string', description: 'MongoDB Document ID (required for read, update, delete)' },
        documentType: { type: 'string', description: 'Type of document (e.g. "policy", "tutorial", "faq"). Required for create/update.' },
        chunkText: { type: 'string', description: 'The actual text content to embed and store. Required for create/update.' },
        sourceUrl: { type: 'string', description: 'Optional source URL or identifier.' }
      },
      required: ['action']
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
    name: 'read_server_logs',
    description: 'Read the latest server logs from the host machine. You can read PM2 logs or Winston local file logs.',
    inputSchema: {
      type: 'object',
      properties: {
        log_type: { type: 'string', enum: ['pm2_error', 'pm2_out', 'winston_error', 'winston_combined'], description: 'The type of logs to read.' },
        lines: { type: 'number', description: 'Number of lines to read from the end of the file. Max 500.' }
      },
      required: ['log_type']
    }
  },
  {
    name: 'aws_ses_connector',
    description: 'Interact with AWS SES (Simple Email Service) to check email sending statistics and verified identities.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['get_statistics', 'list_identities'], description: 'The SES operation to perform.' }
      },
      required: ['operation']
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
        operation: { type: 'string', enum: ['list_events', 'list_drive_files', 'list_emails', 'list_sent_emails', 'mark_email_read', 'get_form', 'list_form_responses', 'create_form', 'create_event', 'create_folder', 'read_drive_file', 'upload_drive_file', 'list_classroom_courses', 'list_classroom_assignments', 'list_classroom_submissions', 'list_classroom_teachers', 'list_classroom_announcements', 'list_classroom_topics', 'list_classroom_materials', 'read_classroom_file'], description: 'The operation to perform.' },
        limit: { type: 'number', description: 'Max results to return.' },
        formId: { type: 'string', description: 'The ID of the Google Form (required for get_form and list_form_responses).' },
        formTitle: { type: 'string', description: 'The title of the new form (required for create_form).' },
        folderName: { type: 'string', description: 'The name of the new folder to create in Drive (required for create_folder).' },
        questions: {
          type: 'array',
          description: 'An array of questions to add to the new form (only for create_form).',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string', enum: ['text', 'multiple_choice'], description: 'Type of question.' },
              options: { type: 'array', items: { type: 'string' }, description: 'Options for multiple_choice questions.' }
            },
            required: ['title', 'type']
          }
        },
        topic: { type: 'string', description: 'The topic/title (for create_event).' },
        startTime: { type: 'string', description: 'Start time in ISO format (for create_event).' },
        endTime: { type: 'string', description: 'End time in ISO format (for create_event).' },
        messageId: { type: 'string', description: 'The ID of the Gmail message (for mark_email_read).' },
        addMeetLink: { type: 'boolean', description: 'Whether to attach a Google Meet link (for create_event).' },
        fileId: { type: 'string', description: 'The ID of the file in Google Drive or Classroom.' },
        fileUrl: { type: 'string', description: 'The public URL of the file to download and upload into Drive (for upload_drive_file).' },
        folderId: { type: 'string', description: 'Optional. The ID of the Drive folder to upload the file into (for upload_drive_file).' },
        mimeType: { type: 'string', description: 'Optional. The MIME type to export as, if exporting a Google Doc (e.g. application/pdf).' },
        courseId: { type: 'string', description: 'The Classroom course ID.' },
        courseworkId: { type: 'string', description: 'The Classroom coursework/assignment ID.' },
        submissionId: { type: 'string', description: 'The Classroom submission ID.' }
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
        operation: { type: 'string', enum: ['list_meetings', 'create_meeting'], description: 'The operation to perform.' },
        topic: { type: 'string', description: 'The topic or title of the meeting (required for create_meeting).' },
        startTime: { type: 'string', description: 'The start time of the meeting in ISO format (required for create_meeting).' },
        duration: { type: 'number', description: 'The duration of the meeting in minutes (optional for create_meeting).' }
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
        operation: { type: 'string', enum: ['list_emails', 'read_email', 'list_meetings', 'create_meeting', 'send_email', 'mark_email_read', 'list_teams', 'list_channels', 'read_channel_messages', 'send_channel_message', 'create_channel', 'list_chats', 'read_chat_messages', 'send_direct_message', 'read_meeting_transcript'], description: 'The operation to perform.' },
        limit: { type: 'number', description: 'Max results to return.' },
        to: { type: 'string', description: 'Recipient email address (for send_email).' },
        subject: { type: 'string', description: 'Subject of the email or meeting (for send_email, create_meeting).' },
        body: { type: 'string', description: 'Body content (for send_email, send_channel_message, send_direct_message).' },
        startTime: { type: 'string', description: 'Start time in UTC ISO format (for create_meeting).' },
        endTime: { type: 'string', description: 'End time in UTC ISO format (for create_meeting).' },
        messageId: { type: 'string', description: 'ID of the email message (for mark_email_read, read_email).' },
        teamId: { type: 'string', description: 'ID of the Microsoft Team (for list_channels, read_channel_messages, send_channel_message, create_channel).' },
        channelId: { type: 'string', description: 'ID of the Microsoft Teams Channel (for read_channel_messages, send_channel_message).' },
        chatId: { type: 'string', description: 'ID of the Microsoft Teams Chat (for read_chat_messages, send_direct_message).' },
        userId: { type: 'string', description: 'Target user ID or email (for list_chats, send_direct_message to new user).' },
        channelName: { type: 'string', description: 'Name of the new channel (for create_channel).' },
        channelDescription: { type: 'string', description: 'Description of the new channel (for create_channel).' },
        meetingId: { type: 'string', description: 'ID of the online meeting (for read_meeting_transcript).' }
      },
      required: ['operation']
    }
  },
  {
    name: 'notion_connector',
    description: 'Interact with Notion API to search pages, databases, and read content using the connected user token.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['search', 'get_page', 'create_page', 'update_page', 'add_comment', 'read_comments'], description: 'The operation to perform.' },
        query: { type: 'string', description: 'The search term (required for search).' },
        limit: { type: 'number', description: 'Max results to return (for search).' },
        pageId: { type: 'string', description: 'The ID of the page, database, or block (required for get_page, create_page parent, update_page, add_comment, read_comments).' },
        title: { type: 'string', description: 'The title of the new page (required for create_page).' },
        content: { type: 'string', description: 'The markdown-like content to insert into the new page, block, or comment (for create_page, update_page, add_comment).' }
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
  },
  {
    name: 'slack_workspace_connector',
    description: 'Interact with Slack API to list channels, read/send messages, create channels, search messages, list users, invite users to channels, and archive/delete channels using the connected user token.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['list_channels', 'read_channel_messages', 'send_message', 'create_channel', 'list_users', 'search_messages', 'invite_to_channel', 'archive_channel'], description: 'The operation to perform.' },
        channelId: { type: 'string', description: 'The ID of the channel (required for read_channel_messages, send_message, invite_to_channel, archive_channel).' },
        text: { type: 'string', description: 'The text content to send (required for send_message).' },
        limit: { type: 'number', description: 'Max results to return (for read_channel_messages).' },
        channelName: { type: 'string', description: 'The name of the new channel (for create_channel).' },
        isPrivate: { type: 'boolean', description: 'Whether the new channel is private (for create_channel).' },
        query: { type: 'string', description: 'Search query string (for search_messages).' },
        userIds: { type: 'string', description: 'Comma-separated Slack user IDs to invite (for invite_to_channel). Note: These must be Slack User IDs (e.g., U1234), not email addresses. Use list_users or search to find IDs.' }
      },
      required: ['operation']
    }
  },
  {
    name: 'github_workspace_connector',
    description: 'Interact with GitHub API to list repos, read/write files, manage issues/PRs, search code, read commit history, and more using the connected user token.',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['list_repos', 'read_file', 'create_issue', 'list_issues', 'create_repo', 'create_or_update_file', 'create_pull_request', 'list_pull_requests', 'add_issue_comment', 'search_code', 'list_commits', 'get_commit', 'list_branches'], description: 'The operation to perform.' },
        owner: { type: 'string', description: 'The repository owner/organization.' },
        repo: { type: 'string', description: 'The repository name.' },
        path: { type: 'string', description: 'The path to the file/directory in the repository (for read_file, create_or_update_file, list_commits filtering).' },
        title: { type: 'string', description: 'The title of the issue or PR (for create_issue, create_pull_request).' },
        body: { type: 'string', description: 'The markdown body (for create_issue, create_pull_request, add_issue_comment).' },
        state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'The state of issues/PRs to list.' },
        repoName: { type: 'string', description: 'The name of the new repository (for create_repo).' },
        isPrivate: { type: 'boolean', description: 'Whether the new repository is private (for create_repo).' },
        content: { type: 'string', description: 'The raw text content of the file (for create_or_update_file).' },
        message: { type: 'string', description: 'The commit message (for create_or_update_file).' },
        branch: { type: 'string', description: 'The branch name (for create_or_update_file).' },
        sha: { type: 'string', description: 'The commit SHA or blob SHA (required for get_commit and updating files).' },
        head: { type: 'string', description: 'The name of the branch where your changes are implemented (for create_pull_request).' },
        base: { type: 'string', description: 'The name of the branch you want the changes pulled into (for create_pull_request).' },
        issueNumber: { type: 'number', description: 'The issue or PR number (for add_issue_comment).' },
        query: { type: 'string', description: 'Search query (for search_code).' }
      },
      required: ['operation']
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

        // --- LAYER 3 TENANT ISOLATION ---
        // If not a super admin, force filter by their organization_id to prevent multi-tenant data leaks.
        if (!isSuperAdmin) {
          const usersCollection = mongoose.connection.db.collection('users');
          const userDoc = await usersCollection.findOne({ email: userEmail });
          if (userDoc && userDoc.organization_id) {
            // Safely inject into query
            if (query && !Array.isArray(query)) {
              query.organization_id = userDoc.organization_id;
            }
          } else {
            return {
              content: [{ type: 'text', text: `SECURITY ERROR: Could not determine your organization_id. Cannot execute query.` }]
            };
          }
        }

        let projection = {};
        if (args.fields && Array.isArray(args.fields) && args.fields.length > 0) {
          args.fields.forEach(f => projection[f] = 1);
        }

        // ISSUE #1 FIX: Reject find/findOne queries without fields to prevent returning full documents
        if ((operation === 'find' || operation === 'findOne') && Object.keys(projection).length === 0) {
          return {
            content: [{ type: 'text', text: `ERROR: You MUST specify the 'fields' parameter with the exact fields you need (e.g. fields: ["name", "email"]). Returning full documents is blocked. Available fields for reference: _id, name, email, role, organization_id, phone, status, createdAt` }]
          };
        }

        // Use user-specified limit, default 20, max 500
        const queryLimit = Math.min(Math.max(1, args.limit || 20), 500);

        if (operation === 'find') {
          if (actualCollectionName === 'users') {
            const pipeline = [
              { $match: query || {} },
              { $limit: queryLimit },
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
            ];

            if (Object.keys(projection).length > 0) {
              pipeline.push({ $project: projection });
            }

            result = await collection.aggregate(pipeline).toArray();
          } else {
            if (Object.keys(projection).length > 0) {
              result = await collection.find(query).project(projection).limit(queryLimit).toArray();
            } else {
              result = await collection.find(query).limit(queryLimit).toArray();
            }
          }
        } else if (operation === 'findOne') {
          if (Object.keys(projection).length > 0) {
            result = await collection.findOne(query, { projection });
          } else {
            result = await collection.findOne(query);
          }
        } else if (operation === 'countDocuments') {
          result = { count: await collection.countDocuments(query) };
        } else if (operation === 'distinct') {
          const field = data?.field || query?.field || 'role';
          const filter = query?.filter || (query?.field ? {} : query);
          result = await collection.distinct(field, filter);
        } else if (operation === 'aggregate') {
          const pipeline = Array.isArray(query) ? query : (Array.isArray(data) ? data : data?.pipeline || query?.pipeline || []);

          if (!isSuperAdmin) {
            const usersCollection = mongoose.connection.db.collection('users');
            const userDoc = await usersCollection.findOne({ email: userEmail });
            if (userDoc && userDoc.organization_id) {
              pipeline.unshift({ $match: { organization_id: userDoc.organization_id } });
            }
          }
          
          const hasLimit = pipeline.some(stage => Object.keys(stage)[0] === '$limit');
          if (!hasLimit) pipeline.push({ $limit: queryLimit });

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

        // Enforce projection for multiple items to solve Issue #1 (Data Leak & Token Limits)
        if (Array.isArray(result) && result.length > 1) {
          const hasFields = args.fields && Array.isArray(args.fields) && args.fields.length > 0;
          const hasProject = operation === 'aggregate' && pipeline && pipeline.some(stage => Object.keys(stage)[0] === '$project');
          
          if (!hasFields && !hasProject) {
            return {
              content: [{ type: 'text', text: `ERROR: Query returned ${result.length} documents. You MUST use the 'fields' array parameter (or a $project stage) to specify exactly which fields you need (e.g. fields: ["name", "email"]). Returning full documents is forbidden for security and token limit reasons. First document keys for reference: ${Object.keys(result[0] || {}).join(', ')}` }]
            };
          }
        }

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ AI TOKEN OVERFLOW PROTECTION ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨
        const aiSafetyReplacer = (key, value) => {
          const forbiddenKeys = [
            'password', 'profilePicture', 'profileBanner', 'logo', 'favicon', 'signature',
            'activationToken', 'resetPasswordToken', 'payroll_config', 'preferences', 'settings',
            'fee_structures', 'modules', 'theme', 'audit_logs', 'history', 'metadata', 'permissions',
            'hash', 'salt', 'biometric', 'token', 'secret'
          ];
          if (forbiddenKeys.some(fk => key.toLowerCase().includes(fk))) return undefined;

          if (typeof value === 'string' && value.length > 500) return "[TRUNCATED HUGE STRING]";

          // Aggressive list protection: If we are returning a list of documents, strip out any nested arrays to prevent context overflow!
          if (key !== "" && Array.isArray(value) && value.length > 3 && Array.isArray(result) && result.length > 2) {
            return `[Array of ${value.length} items TRUNCATED to save context]`;
          }

          return value;
        };

        let outputText = JSON.stringify(result, aiSafetyReplacer, 2);
        
        if (outputText.length > 10000) {
          return {
            content: [{ type: 'text', text: `ERROR: The result is too large (${outputText.length} bytes). Even with fields requested, it exceeds the context window. Add a stricter filter to your query.` }]
          };
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

        if (operation === 'count' || operation === 'countDocuments') {
          // Aggregate count operation — returns total count without fetching raw records
          const { count, error } = await sb.from(collectionOrTable).select('*', { count: 'exact', head: true }).match(query);
          if (error) throw error;
          result = { total_count: count };
        } else if (operation === 'find' || operation === 'findOne') {
          // Use requested fields instead of select('*') to minimize payload size
          const selectFields = (args.fields && Array.isArray(args.fields) && args.fields.length > 0)
            ? args.fields.join(',')
            : '*';
          let sbQuery = sb.from(collectionOrTable).select(selectFields).match(query).limit(operation === 'findOne' ? 1 : (args.limit ? Math.min(args.limit, 500) : 500));
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
          const forbiddenKeys = ['password', 'profilePicture', 'profileBanner', 'logo', 'favicon', 'signature',
            'activationToken', 'resetPasswordToken', 'payroll_config', 'preferences', 'settings',
            'fee_structures', 'modules', 'theme', 'audit_logs', 'history', 'metadata', 'permissions',
            'hash', 'salt', 'biometric', 'token', 'secret'];
          if (forbiddenKeys.some(fk => key.toLowerCase().includes(fk))) return undefined;
          if (typeof value === 'string' && value.length > 500) return "[TRUNCATED HUGE STRING]";
          if (key !== "" && Array.isArray(value) && value.length > 3 && Array.isArray(result) && result.length > 2) {
            return `[Array of ${value.length} items TRUNCATED to save context]`;
          }
          return value;
        };

        let outputText = JSON.stringify(result, aiSafetyReplacer, 2);


        if (outputText.length > 10000) {
          return {
            content: [{ type: 'text', text: `ERROR: The result is too large (${outputText.length} bytes). The Supabase query returned too much data. Use 'count' operation for totals, request fewer fields, add filters, or reduce the limit.` }]
          };
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
      console.log(`\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  [THOUGHT] ${title}: ${details}`);
      return {
        content: [{ type: 'text', text: `Thought recorded successfully. Proceed with your next action.` }]
      };
    }

    if (name === 'execute_terminal_command') {
      let command = args?.command || '';
      const { sessionId = 'default', userEmail = 'unknown' } = context;

      console.log(`\n=================================================`);
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ [SANDBOX TERMINAL ACTION STARTED]`);
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ User: ${userEmail} | ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Session: ${sessionId}`);
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» Command:\n${command}`);
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

        const envVars = ` -e MONGO_URI="${(process.env.MONGO_URI || '').replace(/"/g, '\\"')}" -e VOYAGE_API_KEY="${process.env.VOYAGE_API_KEY || ''}" -e CLOUDFLARE_ACCOUNT_ID="${process.env.CLOUDFLARE_ACCOUNT_ID || ''}" -e CLOUDFLARE_WORKERS_AI_TOKEN="${process.env.CLOUDFLARE_WORKERS_AI_TOKEN || ''}" -e OPENAI_API_KEY="${process.env.OPENAI_API_KEY || ''}" -e ANTHROPIC_API_KEY="${process.env.ANTHROPIC_API_KEY || ''}" -e GROQ_API_KEY="${process.env.GROQ_API_KEY || ''}" -e GEMINI_API_KEY="${process.env.GEMINI_API_KEY || ''}" -e MISTRAL_API_KEY="${process.env.MISTRAL_API_KEY || ''}" -e MISTRAL_API_KEY_2="${process.env.MISTRAL_API_KEY_2 || ''}" -e TAVILY_API_KEY="${process.env.TAVILY_API_KEY || ''}" -e GITHUB_TOKEN="${process.env.GITHUB_TOKEN || ''}" -e SUPABASE_CHAT_URL="${process.env.SUPABASE_CHAT_URL || ''}" -e SUPABASE_CHAT_KEY="${process.env.SUPABASE_CHAT_KEY || ''}" -e SUPABASE_SERVICE_ROLE_KEY="${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}" -e RESEND_API_KEY="${process.env.RESEND_API_KEY || ''}" -e GIPHY_API_KEY="${process.env.GIPHY_API_KEY || ''}" -e SANITY_PROJECT_ID="${process.env.SANITY_PROJECT_ID || ''}" -e SANITY_DATASET="${process.env.SANITY_DATASET || ''}" -e SANITY_API_WRITE_TOKEN="${process.env.SANITY_API_WRITE_TOKEN || ''}" -e AGORA_APP_ID="${process.env.AGORA_APP_ID || ''}" -e AGORA_APP_CERTIFICATE="${process.env.AGORA_APP_CERTIFICATE || ''}" -e RAZORPAY_KEY_ID="${process.env.RAZORPAY_KEY_ID || ''}" -e RAZORPAY_KEY_SECRET="${process.env.RAZORPAY_KEY_SECRET || ''}" -e ZOOM_CLIENT_ID="${process.env.ZOOM_CLIENT_ID || ''}" -e ZOOM_CLIENT_SECRET="${process.env.ZOOM_CLIENT_SECRET || ''}" -e WHATSAPP_PHONE_ID="${process.env.WHATSAPP_PHONE_ID || ''}" -e WHATSAPP_ACCESS_TOKEN="${process.env.WHATSAPP_ACCESS_TOKEN || ''}" -e SLACK_WEBHOOK_URL="${process.env.SLACK_WEBHOOK_URL || ''}" -e VERCEL_API_TOKEN="${process.env.VERCEL_API_TOKEN || ''}" -e NOTION_CLIENT_ID="${process.env.NOTION_CLIENT_ID || ''}" -e NOTION_CLIENT_SECRET="${process.env.NOTION_CLIENT_SECRET || ''}" -e SLACK_CLIENT_ID="${process.env.SLACK_CLIENT_ID || ''}" -e SLACK_CLIENT_SECRET="${process.env.SLACK_CLIENT_SECRET || ''}" -e AWS_ACCESS_KEY_ID="${process.env.AWS_ACCESS_KEY_ID || ''}" -e AWS_SECRET_ACCESS_KEY="${process.env.AWS_SECRET_ACCESS_KEY || ''}" -e AWS_S3_REGION="${process.env.AWS_S3_REGION || ''}" -e AWS_S3_BUCKET="${process.env.AWS_S3_BUCKET || ''}" -e AWS_S3_ERP_ACCESS_KEY="${process.env.AWS_S3_ERP_ACCESS_KEY || ''}" -e AWS_S3_ERP_SECRET_KEY="${process.env.AWS_S3_ERP_SECRET_KEY || ''}" -e AWS_S3_ERP_REGION="${process.env.AWS_S3_ERP_REGION || ''}" -e AWS_S3_ERP_BUCKET_NAME="${process.env.AWS_S3_ERP_BUCKET_NAME || ''}" -e AWS_CLOUDFRONT_ERP_DOMAIN="${process.env.AWS_CLOUDFRONT_ERP_DOMAIN || ''}" -e AWS_SES_SMTP_HOST="${process.env.AWS_SES_SMTP_HOST || ''}" -e AWS_SES_SMTP_USER="${process.env.AWS_SES_SMTP_USER || ''}" -e AWS_SES_SMTP_PASS="${process.env.AWS_SES_SMTP_PASS || ''}" -e R2_ACCOUNT_ID="${process.env.R2_ACCOUNT_ID || ''}" -e R2_ACCESS_KEY_ID="${process.env.R2_ACCESS_KEY_ID || ''}" -e R2_SECRET_ACCESS_KEY="${process.env.R2_SECRET_ACCESS_KEY || ''}" -e R2_BUCKET_NAME="${process.env.R2_BUCKET_NAME || 'classgrid-storage'}" -e R2_PUBLIC_URL="${process.env.R2_PUBLIC_URL || 'https://pub-96a564393c0440f2bab37ad8bbe92398.r2.dev'}" -e NODE_ENV="${process.env.NODE_ENV || 'production'}" -e FRONTEND_URL="${process.env.FRONTEND_URL || 'https://classgrid.in'}" -e BACKEND_URL="${process.env.BACKEND_URL || 'https://api.classgrid.in'}" `;

        console.log(`[Sandbox] Securely injecting credentials and running Docker container for terminal command...`);
        const dockerCommand = `docker run --rm ${envVars} -v /home/ubuntu/sandbox_data/${sessionId}:/data my-agent-sandbox bash /data/script.sh`;
        const result = await ssh.execCommand(dockerCommand);

        console.log(`\n=================================================`);
        console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ [SANDBOX TERMINAL ACTION FINISHED]`);
        console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ STDOUT:\n${result.stdout}`);
        if (result.stderr) console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ STDERR:\n${result.stderr}`);
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
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ [SANDBOX CODE EXECUTION STARTED]`);
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ User: ${userEmail} | ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Session: ${sessionId}`);
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» Language: ${language}`);
      console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Code Payload:\n${code}`);
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
        let finalCode = code;

        if (language === 'python') {
          ext = 'py';
          execCmd = 'python3';
          // Auto-inject common standard libraries to prevent AI hallucination/forgetting errors
          finalCode = "import os, sys, json, base64, math, datetime, re\n" + finalCode;
        }
        else if (language === 'javascript' || language === 'js' || language === 'node') { ext = 'js'; execCmd = 'node'; }
        else if (language === 'bash' || language === 'sh' || language === 'shell') { ext = 'sh'; execCmd = 'bash'; }
        else throw new Error("Unsupported language. Use python, javascript, or bash.");

        // Create the directory on the host, write the file from the code string (using a heredoc to preserve exact contents),
        // and then run the docker container which maps that directory to /data and executes the file.
        const scriptPath = `/home/ubuntu/sandbox_data/${sessionId}/script.${ext}`;

        // We use EOF heredoc to safely write the script without quote escaping issues
        const writeCommand = `mkdir -p /home/ubuntu/sandbox_data/${sessionId} && cat << 'EOF_SCRIPT' > ${scriptPath}\n${finalCode}\nEOF_SCRIPT`;
        await ssh.execCommand(writeCommand);

        const envVars = ` -e MONGO_URI="${(process.env.MONGO_URI || '').replace(/"/g, '\\"')}" -e VOYAGE_API_KEY="${process.env.VOYAGE_API_KEY || ''}" -e CLOUDFLARE_ACCOUNT_ID="${process.env.CLOUDFLARE_ACCOUNT_ID || ''}" -e CLOUDFLARE_WORKERS_AI_TOKEN="${process.env.CLOUDFLARE_WORKERS_AI_TOKEN || ''}" -e OPENAI_API_KEY="${process.env.OPENAI_API_KEY || ''}" -e ANTHROPIC_API_KEY="${process.env.ANTHROPIC_API_KEY || ''}" -e GROQ_API_KEY="${process.env.GROQ_API_KEY || ''}" -e GEMINI_API_KEY="${process.env.GEMINI_API_KEY || ''}" -e MISTRAL_API_KEY="${process.env.MISTRAL_API_KEY || ''}" -e MISTRAL_API_KEY_2="${process.env.MISTRAL_API_KEY_2 || ''}" -e TAVILY_API_KEY="${process.env.TAVILY_API_KEY || ''}" -e GITHUB_TOKEN="${process.env.GITHUB_TOKEN || ''}" -e SUPABASE_CHAT_URL="${process.env.SUPABASE_CHAT_URL || ''}" -e SUPABASE_CHAT_KEY="${process.env.SUPABASE_CHAT_KEY || ''}" -e SUPABASE_SERVICE_ROLE_KEY="${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}" -e RESEND_API_KEY="${process.env.RESEND_API_KEY || ''}" -e GIPHY_API_KEY="${process.env.GIPHY_API_KEY || ''}" -e SANITY_PROJECT_ID="${process.env.SANITY_PROJECT_ID || ''}" -e SANITY_DATASET="${process.env.SANITY_DATASET || ''}" -e SANITY_API_WRITE_TOKEN="${process.env.SANITY_API_WRITE_TOKEN || ''}" -e AGORA_APP_ID="${process.env.AGORA_APP_ID || ''}" -e AGORA_APP_CERTIFICATE="${process.env.AGORA_APP_CERTIFICATE || ''}" -e RAZORPAY_KEY_ID="${process.env.RAZORPAY_KEY_ID || ''}" -e RAZORPAY_KEY_SECRET="${process.env.RAZORPAY_KEY_SECRET || ''}" -e ZOOM_CLIENT_ID="${process.env.ZOOM_CLIENT_ID || ''}" -e ZOOM_CLIENT_SECRET="${process.env.ZOOM_CLIENT_SECRET || ''}" -e WHATSAPP_PHONE_ID="${process.env.WHATSAPP_PHONE_ID || ''}" -e WHATSAPP_ACCESS_TOKEN="${process.env.WHATSAPP_ACCESS_TOKEN || ''}" -e SLACK_WEBHOOK_URL="${process.env.SLACK_WEBHOOK_URL || ''}" -e VERCEL_API_TOKEN="${process.env.VERCEL_API_TOKEN || ''}" -e NOTION_CLIENT_ID="${process.env.NOTION_CLIENT_ID || ''}" -e NOTION_CLIENT_SECRET="${process.env.NOTION_CLIENT_SECRET || ''}" -e SLACK_CLIENT_ID="${process.env.SLACK_CLIENT_ID || ''}" -e SLACK_CLIENT_SECRET="${process.env.SLACK_CLIENT_SECRET || ''}" -e AWS_ACCESS_KEY_ID="${process.env.AWS_ACCESS_KEY_ID || ''}" -e AWS_SECRET_ACCESS_KEY="${process.env.AWS_SECRET_ACCESS_KEY || ''}" -e AWS_S3_REGION="${process.env.AWS_S3_REGION || ''}" -e AWS_S3_BUCKET="${process.env.AWS_S3_BUCKET || ''}" -e AWS_S3_ERP_ACCESS_KEY="${process.env.AWS_S3_ERP_ACCESS_KEY || ''}" -e AWS_S3_ERP_SECRET_KEY="${process.env.AWS_S3_ERP_SECRET_KEY || ''}" -e AWS_S3_ERP_REGION="${process.env.AWS_S3_ERP_REGION || ''}" -e AWS_S3_ERP_BUCKET_NAME="${process.env.AWS_S3_ERP_BUCKET_NAME || ''}" -e AWS_CLOUDFRONT_ERP_DOMAIN="${process.env.AWS_CLOUDFRONT_ERP_DOMAIN || ''}" -e AWS_SES_SMTP_HOST="${process.env.AWS_SES_SMTP_HOST || ''}" -e AWS_SES_SMTP_USER="${process.env.AWS_SES_SMTP_USER || ''}" -e AWS_SES_SMTP_PASS="${process.env.AWS_SES_SMTP_PASS || ''}" -e R2_ACCOUNT_ID="${process.env.R2_ACCOUNT_ID || ''}" -e R2_ACCESS_KEY_ID="${process.env.R2_ACCESS_KEY_ID || ''}" -e R2_SECRET_ACCESS_KEY="${process.env.R2_SECRET_ACCESS_KEY || ''}" -e R2_BUCKET_NAME="${process.env.R2_BUCKET_NAME || 'classgrid-storage'}" -e R2_PUBLIC_URL="${process.env.R2_PUBLIC_URL || 'https://pub-96a564393c0440f2bab37ad8bbe92398.r2.dev'}" -e NODE_ENV="${process.env.NODE_ENV || 'production'}" -e FRONTEND_URL="${process.env.FRONTEND_URL || 'https://classgrid.in'}" -e BACKEND_URL="${process.env.BACKEND_URL || 'https://api.classgrid.in'}" `;

        console.log(`[Sandbox] Securely injecting credentials and running Docker container for ${language} script...`);
        const dockerCommand = `docker run --rm ${envVars} -v /home/ubuntu/sandbox_data/${sessionId}:/data my-agent-sandbox ${execCmd} /data/script.${ext}`;
        const result = await ssh.execCommand(dockerCommand);

        console.log(`\n=================================================`);
        console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ [SANDBOX CODE EXECUTION FINISHED]`);
        console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ STDOUT:\n${result.stdout}`);
        if (result.stderr) console.log(`ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â´ STDERR:\n${result.stderr}`);
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

      console.log(`\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ [AWS NATIVE] AI is generating a REAL PDF document securely using Puppeteer!`);

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
        console.log(`\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ [AWS NATIVE] AI is directly fetching data and using Handlebars to bypass token limits!`);
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

    if (name === 'manage_rag_document') {
      const { action, id, documentType, chunkText, sourceUrl = 'ai-generated' } = args;
      
      try {
        if (!mongoose.connection.db) {
          throw new Error("MongoDB connection not established");
        }
        const coll = mongoose.connection.db.collection('platform_rag_chunks');
        const { ObjectId } = mongoose.Types;

        if (action === 'list') {
          const docs = await coll.find({}, { projection: { chunkText: 1, documentType: 1, sourceUrl: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(50).toArray();
          return { content: [{ type: 'text', text: `Found ${docs.length} RAG documents:\n` + JSON.stringify(docs, null, 2) }] };
        }

        if (action === 'read') {
          if (!id) throw new Error("ID required for read action");
          const doc = await coll.findOne({ _id: new ObjectId(id) }, { projection: { embedding: 0 } }); // Hide giant embedding vector
          if (!doc) return { content: [{ type: 'text', text: `Document ${id} not found.` }] };
          return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
        }

        if (action === 'delete') {
          if (!id) throw new Error("ID required for delete action");
          const result = await coll.deleteOne({ _id: new ObjectId(id) });
          return { content: [{ type: 'text', text: result.deletedCount > 0 ? `Successfully deleted document ${id}` : `Document ${id} not found.` }] };
        }

        if (action === 'create' || action === 'update') {
          if (!documentType || !chunkText) throw new Error("documentType and chunkText are required for create/update");
          if (action === 'update' && !id) throw new Error("ID required for update action");

          console.log(`[RAG] Generating embedding for documentType: ${documentType}`);
          const voyageRes = await fetch("https://ai.mongodb.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.VOYAGE_API_KEY.trim()}`
            },
            body: JSON.stringify({
              input: chunkText,
              model: "voyage-3-large"
            })
          });

          if (!voyageRes.ok) {
            const errText = await voyageRes.text();
            throw new Error(`Voyage AI (Atlas) error: ${errText}`);
          }

          const embeddingResponse = await voyageRes.json();
          const embedding = embeddingResponse.data[0].embedding;

          if (action === 'create') {
            const result = await coll.insertOne({
              chunkText,
              embedding,
              documentType,
              sourceUrl,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            return { content: [{ type: 'text', text: `Successfully created RAG Document! ID: ${result.insertedId}` }] };
          } else {
            const result = await coll.updateOne(
              { _id: new ObjectId(id) },
              { $set: { chunkText, embedding, documentType, sourceUrl, updatedAt: new Date() } }
            );
            return { content: [{ type: 'text', text: result.matchedCount > 0 ? `Successfully updated RAG Document ${id}` : `Document ${id} not found.` }] };
          }
        }

        throw new Error("Invalid action. Must be create, read, update, delete, or list.");
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to manage RAG document: ${e.message}` }] };
      }
    }

    if (name === 'read_server_logs') {
      const { log_type, lines = 100 } = args;
      const numLines = Math.min(lines, 500); // Cap at 500
      try {
        let command = '';
        if (log_type === 'pm2_error') {
          command = `pm2 logs --err --nostream --lines ${numLines}`;
        } else if (log_type === 'pm2_out') {
          command = `pm2 logs --out --nostream --lines ${numLines}`;
        } else if (log_type === 'winston_error') {
          command = `tail -n ${numLines} logs/error.log || echo 'File not found'`;
        } else if (log_type === 'winston_combined') {
          command = `tail -n ${numLines} logs/combined.log || echo 'File not found'`;
        }
        
        const { stdout, stderr } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });
        let resultText = stdout || stderr;
        if (!resultText) resultText = "No logs found or empty output.";
        // TRUNCATE TO LAST 8000 CHARS TO PREVENT CONTEXT WINDOW OVERFLOW CRASHES
        return { content: [{ type: 'text', text: resultText.substring(resultText.length - 8000) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Failed to read server logs: ${err.message}\nStderr: ${err.stderr || ''}` }] };
      }
    }

    if (name === 'aws_ses_connector') {
      const { operation } = args;
      try {
        // Classgrid uses EU-NORTH-1 for SES based on .env
        const sesClient = new SESClient({
          region: 'eu-north-1',
          credentials: {
            accessKeyId: process.env.AWS_S3_ERP_ACCESS_KEY,
            secretAccessKey: process.env.AWS_S3_ERP_SECRET_KEY
          }
        });

        if (operation === 'get_statistics') {
          const command = new GetSendStatisticsCommand({});
          const response = await sesClient.send(command);
          return { content: [{ type: 'text', text: `AWS SES Statistics:\n` + JSON.stringify(response.SendDataPoints, null, 2) }] };
        }

        if (operation === 'list_identities') {
          const command = new ListIdentitiesCommand({ IdentityType: "EmailAddress" });
          const response = await sesClient.send(command);
          return { content: [{ type: 'text', text: `Verified AWS SES Identities:\n` + JSON.stringify(response.Identities, null, 2) }] };
        }

        throw new Error("Invalid operation for aws_ses_connector");
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed AWS SES operation: ${e.message}\nNote: Make sure the IAM keys (AWS_S3_ERP_ACCESS_KEY) have SES permissions.` }] };
      }
    }

    if (name === 'vercel_connector') {
      const { operation, projectId, limit = 10, deploymentId } = args;
      const { userEmail = '', userRole = '' } = context;

      // Fetch the OAuth token from the database
      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || !user.vercel_access_token) {
        return {
          content: [{ type: 'text', text: `Error: No Vercel OAuth token found. Please connect your Vercel account from the settings page first.` }]
        };
      }
      const vercelToken = user.vercel_access_token;
      const vercelTeamId = user.vercel_team_id;

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

        if (vercelTeamId) {
          endpoint += (endpoint.includes('?') ? '&' : '?') + `teamId=${vercelTeamId}`;
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

        // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ AI TOKEN OVERFLOW PROTECTION ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨
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
      const { operation, limit = 10, formId, formTitle, folderName, eventTitle, eventStartTime, eventEndTime, questions } = args;
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
        } else if (operation === 'create_folder') {
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const fileMetadata = {
            name: folderName || 'New Folder',
            mimeType: 'application/vnd.google-apps.folder',
          };
          const res = await drive.files.create({
            resource: fileMetadata,
            fields: 'id, name, webViewLink',
          });
          data = res.data;
        } else if (operation === 'read_drive_file') {
          if (!args.fileId) throw new Error("fileId is required for read_drive_file");
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const fileMeta = await drive.files.get({ fileId: args.fileId, fields: 'name, mimeType' });
          const isGoogleWorkspaceType = fileMeta.data.mimeType.startsWith('application/vnd.google-apps.');

          let buffer;
          let mime = fileMeta.data.mimeType;
          if (isGoogleWorkspaceType) {
            const exportMime = args.mimeType || 'application/pdf';
            if (fileMeta.data.mimeType === 'application/vnd.google-apps.folder') throw new Error("Cannot read a folder as a file.");
            const file = await drive.files.export({ fileId: args.fileId, mimeType: exportMime }, { responseType: 'arraybuffer' });
            buffer = Buffer.from(file.data);
            mime = exportMime;
            if (exportMime === 'application/pdf' && !fileMeta.data.name.endsWith('.pdf')) fileMeta.data.name += '.pdf';
          } else {
            const file = await drive.files.get({ fileId: args.fileId, alt: 'media' }, { responseType: 'arraybuffer' });
            buffer = Buffer.from(file.data);
          }

          if (buffer.length > 10 * 1024 * 1024) throw new Error("File exceeds 10MB limit. OCR/Parsing rejected.");
          const url = await uploadBufferToR2(buffer, fileMeta.data.name, mime, `ai-temp-cache/${Date.now()}-${fileMeta.data.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
          data = { message: "File downloaded and securely staged in R2 temp cache.", url, name: fileMeta.data.name, mimeType: mime, sizeBytes: buffer.length };
        } else if (operation === 'upload_drive_file') {
          if (!args.fileUrl) throw new Error("fileUrl is required for upload_drive_file");

          // Download file from URL
          const fetchRes = await fetch(args.fileUrl);
          if (!fetchRes.ok) throw new Error(`Failed to download file from URL: ${fetchRes.statusText}`);
          const arrBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrBuffer);
          const mime = fetchRes.headers.get('content-type') || 'application/octet-stream';
          const fileName = args.fileUrl.split('/').pop()?.split('?')[0] || `uploaded_${Date.now()}`;

          // Upload to Drive
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const resource = { name: fileName };
          if (args.folderId) {
            resource.parents = [args.folderId];
          }
          const res = await drive.files.create({
            resource: resource,
            media: { mimeType: mime, body: Readable.from(buffer) },
            fields: 'id, name, webViewLink'
          });
          data = { message: "File successfully uploaded to Google Drive.", ...res.data };
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
        } else if (operation === 'mark_email_read') {
          if (!args.messageId) throw new Error("messageId is required for mark_email_read");
          const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
          await gmail.users.messages.modify({
            userId: 'me',
            id: args.messageId,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          data = { message: "Email marked as read successfully." };
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
        } else if (operation === 'create_form') {
          if (!args.formTitle) throw new Error("formTitle is required for create_form");
          const forms = google.forms({ version: 'v1', auth: oauth2Client });
          const res = await forms.forms.create({
            requestBody: {
              info: { title: args.formTitle }
            }
          });

          let formId = res.data.formId;

          if (args.questions && args.questions.length > 0) {
            let requests = [];
            let index = 0;
            for (let q of args.questions) {
              let item = {
                title: q.title,
                questionItem: {
                  question: { required: true }
                }
              };
              if (q.type === 'text') {
                item.questionItem.question.textQuestion = { paragraph: false };
              } else if (q.type === 'multiple_choice') {
                item.questionItem.question.choiceQuestion = {
                  type: 'RADIO',
                  options: (q.options || []).map(o => ({ value: o }))
                };
              } else {
                item.questionItem.question.textQuestion = { paragraph: false };
              }
              requests.push({
                createItem: {
                  item: item,
                  location: { index: index }
                }
              });
              index++;
            }

            await forms.forms.batchUpdate({
              formId: formId,
              requestBody: { requests }
            });
          }

          data = { formId, formUrl: res.data.responderUri || `https://docs.google.com/forms/d/${formId}/edit` };
        } else if (operation === 'create_event') {
          if (!args.topic || !args.startTime || !args.endTime) throw new Error("topic, startTime, and endTime are required for create_event");
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
          let eventParams = {
            calendarId: 'primary',
            requestBody: {
              summary: args.topic,
              start: { dateTime: args.startTime },
              end: { dateTime: args.endTime }
            }
          };
          if (args.addMeetLink) {
            eventParams.conferenceDataVersion = 1;
            eventParams.requestBody.conferenceData = {
              createRequest: {
                requestId: Math.random().toString(36).substring(2, 12),
                conferenceSolutionKey: { type: "hangoutsMeet" }
              }
            };
          }
          const res = await calendar.events.insert(eventParams);
          data = res.data;
        } else if (operation === 'list_classroom_courses') {
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.list({ pageSize: limit, courseStates: ['ACTIVE'] });
          data = res.data.courses || [];
        } else if (operation === 'list_classroom_teachers') {
          if (!args.courseId) throw new Error("courseId is required for list_classroom_teachers");
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.teachers.list({ courseId: args.courseId, pageSize: limit });
          data = res.data.teachers || [];
        } else if (operation === 'list_classroom_announcements') {
          if (!args.courseId) throw new Error("courseId is required for list_classroom_announcements");
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.announcements.list({ courseId: args.courseId, pageSize: limit });
          data = res.data.announcements || [];
        } else if (operation === 'list_classroom_topics') {
          if (!args.courseId) throw new Error("courseId is required for list_classroom_topics");
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.topics.list({ courseId: args.courseId, pageSize: limit });
          data = res.data.topic || [];
        } else if (operation === 'list_classroom_assignments') {
          if (!args.courseId) throw new Error("courseId is required for list_classroom_assignments");
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.courseWork.list({ courseId: args.courseId, pageSize: limit });
          data = res.data.courseWork || [];
        } else if (operation === 'list_classroom_materials') {
          if (!args.courseId) throw new Error("courseId is required for list_classroom_materials");
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.courseWorkMaterials.list({ courseId: args.courseId, pageSize: limit });
          data = res.data.courseWorkMaterial || [];
        } else if (operation === 'list_classroom_submissions') {
          if (!args.courseId || !args.courseworkId) throw new Error("courseId and courseworkId are required for list_classroom_submissions");
          const classroom = google.classroom({ version: 'v1', auth: oauth2Client });
          const res = await classroom.courses.courseWork.studentSubmissions.list({ courseId: args.courseId, courseWorkId: args.courseworkId, pageSize: limit });
          data = res.data.studentSubmissions || [];
        } else if (operation === 'read_classroom_file') {
          if (!args.fileId) throw new Error("fileId is required for read_classroom_file");
          // Classroom files are just Drive files, so we reuse the read_drive_file logic under the hood
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const fileMeta = await drive.files.get({ fileId: args.fileId, fields: 'name, mimeType' });
          const isGoogleWorkspaceType = fileMeta.data.mimeType.startsWith('application/vnd.google-apps.');

          let buffer;
          let mime = fileMeta.data.mimeType;
          if (isGoogleWorkspaceType) {
            const exportMime = args.mimeType || 'application/pdf';
            if (fileMeta.data.mimeType === 'application/vnd.google-apps.folder') throw new Error("Cannot read a folder as a file.");
            const file = await drive.files.export({ fileId: args.fileId, mimeType: exportMime }, { responseType: 'arraybuffer' });
            buffer = Buffer.from(file.data);
            mime = exportMime;
            if (exportMime === 'application/pdf' && !fileMeta.data.name.endsWith('.pdf')) fileMeta.data.name += '.pdf';
          } else {
            const file = await drive.files.get({ fileId: args.fileId, alt: 'media' }, { responseType: 'arraybuffer' });
            buffer = Buffer.from(file.data);
          }

          if (buffer.length > 10 * 1024 * 1024) throw new Error("File exceeds 10MB limit. OCR/Parsing rejected.");
          const url = await uploadBufferToR2(buffer, fileMeta.data.name, mime, `ai-temp-cache/${Date.now()}-${fileMeta.data.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
          data = { message: "Classroom file downloaded and securely staged in R2 temp cache.", url, name: fileMeta.data.name, mimeType: mime, sizeBytes: buffer.length };
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
        } else if (operation === 'create_meeting') {
          if (!args.topic || !args.startTime) throw new Error("topic and startTime are required for create_meeting");
          const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              topic: args.topic,
              type: 2,
              start_time: args.startTime,
              duration: args.duration || 60,
              settings: { host_video: true, participant_video: true, join_before_host: false }
            })
          });
          const data = await res.json();
          if (data.code) throw new Error(`Zoom API error: ${data.message}`);
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Zoom API call: ${e.message}` }] };
      }
    }

    if (name === 'microsoft_workspace_connector') {
      const { operation, limit = 10, to, subject, body, startTime, endTime, messageId } = args;
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
          
          try {
            const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
                headers: { "Authorization": `Bearer ${tokenData.access_token}` }
            });
            if (profileRes.ok) {
                const profile = await profileRes.json();
                if (profile.displayName) user.microsoft_name = profile.displayName;
                if (profile.mail || profile.userPrincipalName) user.microsoft_email = profile.mail || profile.userPrincipalName;
            }
          } catch (e) {
            console.error("Failed to sync Microsoft profile during tool refresh:", e);
          }
          
          await user.save();
          accessToken = user.microsoft_access_token;
        }

        if (operation === 'list_sent_emails') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders('SentItems')/messages?$top=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          const safeData = (data.value || []).map(msg => ({
            id: msg.id,
            subject: msg.subject,
            to: msg.toRecipients?.map(r => r.emailAddress?.address).join(', ') || 'Unknown',
            sentDateTime: msg.sentDateTime,
            bodyPreview: msg.bodyPreview
          }));
          return { content: [{ type: 'text', text: JSON.stringify(safeData, null, 2) }] };
        } else if (operation === 'list_emails') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$filter=isRead eq false`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          const safeData = (data.value || []).map(msg => ({
            id: msg.id,
            subject: msg.subject,
            senderName: msg.sender?.emailAddress?.name || msg.from?.emailAddress?.name || 'Unknown',
            senderEmail: msg.sender?.emailAddress?.address || msg.from?.emailAddress?.address || 'Unknown',
            receivedDateTime: msg.receivedDateTime,
            bodyPreview: msg.bodyPreview
          }));
          return { content: [{ type: 'text', text: JSON.stringify(safeData, null, 2) }] };
        } else if (operation === 'read_email') {
          if (!messageId) throw new Error("messageId is required for read_email");
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else if (operation === 'list_meetings') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings?$top=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'create_meeting') {
          if (!subject || !startTime || !endTime) throw new Error("subject, startTime, and endTime are required for create_meeting");
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/events`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: subject,
              start: { dateTime: startTime, timeZone: "UTC" },
              end: { dateTime: endTime, timeZone: "UTC" },
              isOnlineMeeting: true
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to create meeting");
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else if (operation === 'send_email') {
          if (!to || !subject || !body) throw new Error("to, subject, and body are required for send_email");
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/sendMail`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              message: {
                subject: subject,
                body: { contentType: "HTML", content: body },
                toRecipients: [{ emailAddress: { address: to } }]
              },
              saveToSentItems: "true"
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(`Failed to send email: ${errData?.error?.message || res.statusText}`);
          }
          return { content: [{ type: 'text', text: "Email sent successfully." }] };
        } else if (operation === 'mark_email_read') {
          if (!messageId) throw new Error("messageId is required for mark_email_read");
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
            method: 'PATCH',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: true })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(`Failed to mark email as read: ${errData?.error?.message || res.statusText}`);
          }
          return { content: [{ type: 'text', text: "Email marked as read successfully." }] };
        } else if (operation === 'list_teams') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/joinedTeams`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to list teams");
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'list_channels') {
          if (!args.teamId) throw new Error("teamId is required for list_channels");
          const res = await fetch(`https://graph.microsoft.com/v1.0/teams/${args.teamId}/channels`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to list channels");
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'create_channel') {
          if (!args.teamId || !args.channelName) throw new Error("teamId and channelName are required for create_channel");
          const res = await fetch(`https://graph.microsoft.com/v1.0/teams/${args.teamId}/channels`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: args.channelName,
              description: args.channelDescription || "",
              membershipType: "standard"
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to create channel");
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else if (operation === 'read_channel_messages') {
          if (!args.teamId || !args.channelId) throw new Error("teamId and channelId are required for read_channel_messages");
          const res = await fetch(`https://graph.microsoft.com/v1.0/teams/${args.teamId}/channels/${args.channelId}/messages?$top=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to read channel messages");
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'send_channel_message') {
          if (!args.teamId || !args.channelId || !body) throw new Error("teamId, channelId, and body are required for send_channel_message");
          const res = await fetch(`https://graph.microsoft.com/v1.0/teams/${args.teamId}/channels/${args.channelId}/messages`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              body: { content: body }
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to send channel message");
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else if (operation === 'list_chats') {
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/chats?$top=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to list chats");
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'read_chat_messages') {
          if (!args.chatId) throw new Error("chatId is required for read_chat_messages");
          const res = await fetch(`https://graph.microsoft.com/v1.0/chats/${args.chatId}/messages?$top=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to read chat messages");
          return { content: [{ type: 'text', text: JSON.stringify(data.value, null, 2) }] };
        } else if (operation === 'send_direct_message') {
          let targetChatId = args.chatId;
          if (!targetChatId) {
            if (!args.userId) throw new Error("Either chatId or userId must be provided to send a direct message.");
            const chatRes = await fetch(`https://graph.microsoft.com/v1.0/chats`, {
              method: 'POST',
              headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                chatType: 'oneOnOne',
                members: [
                  { "@odata.type": "#microsoft.graph.aadUserConversationMember", roles: ["owner"], "user@odata.bind": "https://graph.microsoft.com/v1.0/me" },
                  { "@odata.type": "#microsoft.graph.aadUserConversationMember", roles: ["owner"], "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${args.userId}')` }
                ]
              })
            });
            const chatData = await chatRes.json();
            if (chatData.error) throw new Error(chatData.error.message || "Failed to create or get chat with user");
            targetChatId = chatData.id;
          }
          if (!body) throw new Error("body is required to send direct message");
          const res = await fetch(`https://graph.microsoft.com/v1.0/chats/${targetChatId}/messages`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ body: { content: body } })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to send direct message");
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else if (operation === 'read_meeting_transcript') {
          if (!args.meetingId) throw new Error("meetingId is required for read_meeting_transcript");
          const res = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings/${args.meetingId}/transcripts`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || "Failed to list transcripts");
          if (!data.value || data.value.length === 0) return { content: [{ type: 'text', text: "No transcripts found for this meeting." }] };
          const transcriptId = data.value[0].id;
          const contentRes = await fetch(`https://graph.microsoft.com/v1.0/me/onlineMeetings/${args.meetingId}/transcripts/${transcriptId}/content?$format=text/vtt`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (!contentRes.ok) throw new Error("Failed to download transcript content");
          const contentText = await contentRes.text();
          return { content: [{ type: 'text', text: contentText.substring(0, 50000) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Microsoft API call: ${e.message}` }] };
      }
    }

    if (name === 'check_email_logs') {
      const { recipientEmail } = args;
      if (!recipientEmail) throw new Error('recipientEmail is required');
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const NotificationLog = mongoose.model('NotificationLog');
      const logs = await NotificationLog.find({ recipient: recipientEmail, type: 'EMAIL', createdAt: { $gte: fifteenMinutesAgo } }).lean();
      if (logs.length > 0) {
        return { content: [{ type: 'text', text: 'YES: An email was already sent to ' + recipientEmail + ' recently. DO NOT SEND AGAIN.' }] };
      }
      return { content: [{ type: 'text', text: 'NO: No recent email found for ' + recipientEmail + '. Safe to send.' }] };
    }

    if (name === 'slack_workspace_connector') {
      const { operation, channelId, text, limit = 10, channelName, isPrivate, query, userIds } = args;
      const { userEmail = '' } = context;

      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || !user.slack_access_token) {
        return { content: [{ type: 'text', text: "Error: No Slack account connected. Tell the user to click the Connect button in the AI Hub to link their Slack account." }] };
      }

      const accessToken = user.slack_access_token;

      try {
        if (operation === 'list_channels') {
          const res = await fetch(`https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=50`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to list channels");
          return { content: [{ type: 'text', text: JSON.stringify(data.channels.map(c => ({ id: c.id, name: c.name, is_private: c.is_private })), null, 2) }] };
        } else if (operation === 'read_channel_messages') {
          if (!channelId) throw new Error("channelId is required for read_channel_messages");
          const res = await fetch(`https://slack.com/api/conversations.history?channel=${channelId}&limit=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to read messages");
          return { content: [{ type: 'text', text: JSON.stringify(data.messages, null, 2) }] };
        } else if (operation === 'send_message') {
          if (!channelId || !text) throw new Error("channelId and text are required for send_message");
          const res = await fetch(`https://slack.com/api/chat.postMessage`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ channel: channelId, text })
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to send message");
          return { content: [{ type: 'text', text: JSON.stringify({ success: true, ts: data.ts }, null, 2) }] };
        } else if (operation === 'create_channel') {
          if (!channelName) throw new Error("channelName is required for create_channel");
          const res = await fetch(`https://slack.com/api/conversations.create`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name: channelName, is_private: isPrivate })
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to create channel");
          return { content: [{ type: 'text', text: JSON.stringify({ id: data.channel.id, name: data.channel.name }, null, 2) }] };
        } else if (operation === 'list_users') {
          const res = await fetch(`https://slack.com/api/users.list?limit=50`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to list users");
          return { content: [{ type: 'text', text: JSON.stringify(data.members.filter(u => !u.deleted).map(u => ({ id: u.id, name: u.name, real_name: u.real_name })), null, 2) }] };
        } else if (operation === 'search_messages') {
          if (!query) throw new Error("query is required for search_messages");
          const res = await fetch(`https://slack.com/api/search.messages?query=${encodeURIComponent(query)}&count=${limit}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to search messages");
          return { content: [{ type: 'text', text: JSON.stringify(data.messages.matches, null, 2) }] };
        } else if (operation === 'invite_to_channel') {
          if (!channelId || !userIds) throw new Error("channelId and userIds are required for invite_to_channel");
          const res = await fetch(`https://slack.com/api/conversations.invite`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ channel: channelId, users: userIds })
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to invite to channel");
          return { content: [{ type: 'text', text: JSON.stringify({ success: true, channel: data.channel.id }, null, 2) }] };
        } else if (operation === 'archive_channel') {
          if (!channelId) throw new Error("channelId is required for archive_channel");
          const res = await fetch(`https://slack.com/api/conversations.archive`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ channel: channelId })
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || "Failed to archive channel");
          return { content: [{ type: 'text', text: JSON.stringify({ success: true, message: `Successfully deleted/archived channel ${channelId}` }, null, 2) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Slack API call: ${e.message}` }] };
      }
    }

    if (name === 'github_workspace_connector') {
      const { operation, owner, repo, path: filePath, title, body, state = 'open', repoName, isPrivate, content, message, branch, sha, head, base, issueNumber, query } = args;
      const { userEmail = '' } = context;

      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || !user.github_access_token) {
        return { content: [{ type: 'text', text: "Error: No GitHub account connected. Tell the user to click the Connect button in the AI Hub to link their GitHub account." }] };
      }

      const accessToken = user.github_access_token;
      const headers = {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28"
      };

      try {
        if (operation === 'list_repos') {
          let url = `https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member,collaborator`;
          if (owner) {
            url = `https://api.github.com/orgs/${owner}/repos?per_page=100&sort=updated`;
          }
          const res = await fetch(url, { headers });
          let data = await res.json();
          
          // If org repos fail (e.g. 404 or bad credentials), fallback to user repos
          if (data.message && owner) {
            console.log(`[GitHub] Failed to fetch org repos for ${owner}. Falling back to user repos.`);
            const fallbackRes = await fetch(`https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,organization_member,collaborator`, { headers });
            data = await fallbackRes.json();
          }

          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify(data.map(r => ({ id: r.id, full_name: r.full_name, private: r.private, html_url: r.html_url })), null, 2) }] };
        } else if (operation === 'read_file') {
          if (!owner || !repo || !filePath) throw new Error("owner, repo, and path are required for read_file");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          if (data.type === 'file' && data.content) {
            const contentDecoded = Buffer.from(data.content, 'base64').toString('utf8');
            return { content: [{ type: 'text', text: contentDecoded }] };
          }
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        } else if (operation === 'list_issues') {
          if (!owner || !repo) throw new Error("owner and repo are required for list_issues");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}`, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify(data.map(i => ({ number: i.number, title: i.title, state: i.state, user: i.user.login })), null, 2) }] };
        } else if (operation === 'create_issue') {
          if (!owner || !repo || !title || !body) throw new Error("owner, repo, title, and body are required for create_issue");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ title, body })
          });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify({ number: data.number, html_url: data.html_url }, null, 2) }] };
        } else if (operation === 'create_repo') {
          if (!repoName) throw new Error("repoName is required for create_repo");
          const res = await fetch(`https://api.github.com/user/repos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: repoName, private: isPrivate || false })
          });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify({ id: data.id, full_name: data.full_name, html_url: data.html_url }, null, 2) }] };
        } else if (operation === 'create_or_update_file') {
          if (!owner || !repo || !filePath || !content || !message) throw new Error("owner, repo, path, content, and message are required for create_or_update_file");
          const contentEncoded = Buffer.from(content, 'utf8').toString('base64');
          const payload = { message, content: contentEncoded };
          if (branch) payload.branch = branch;
          if (sha) payload.sha = sha;
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify({ commit: data.commit.html_url, content: data.content?.html_url }, null, 2) }] };
        } else if (operation === 'create_pull_request') {
          if (!owner || !repo || !title || !head || !base) throw new Error("owner, repo, title, head, and base are required for create_pull_request");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ title, body, head, base })
          });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify({ number: data.number, html_url: data.html_url, state: data.state }, null, 2) }] };
        } else if (operation === 'list_pull_requests') {
          if (!owner || !repo) throw new Error("owner and repo are required for list_pull_requests");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify(data.map(pr => ({ number: pr.number, title: pr.title, state: pr.state, url: pr.html_url })), null, 2) }] };
        } else if (operation === 'add_issue_comment') {
          if (!owner || !repo || !issueNumber || !body) throw new Error("owner, repo, issueNumber, and body are required for add_issue_comment");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ body })
          });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify({ id: data.id, html_url: data.html_url }, null, 2) }] };
        } else if (operation === 'search_code') {
          if (!query) throw new Error("query is required for search_code");
          const res = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}`, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify(data.items.slice(0, 10).map(i => ({ name: i.name, path: i.path, repository: i.repository.full_name, html_url: i.html_url })), null, 2) }] };
        } else if (operation === 'list_commits') {
          if (!owner || !repo) throw new Error("owner and repo are required for list_commits");
          let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`;
          if (filePath) url += `&path=${filePath}`;
          const res = await fetch(url, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify(data.map(c => ({ sha: c.sha, message: c.commit.message, author: c.commit.author.name, date: c.commit.author.date })), null, 2) }] };
        } else if (operation === 'get_commit') {
          if (!owner || !repo || !sha) throw new Error("owner, repo, and sha are required for get_commit");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify({ sha: data.sha, message: data.commit.message, files: data.files?.map(f => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions, patch: f.patch })) }, null, 2) }] };
        } else if (operation === 'list_branches') {
          if (!owner || !repo) throw new Error("owner and repo are required for list_branches");
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=50`, { headers });
          const data = await res.json();
          if (data.message) throw new Error(data.message);
          return { content: [{ type: 'text', text: JSON.stringify(data.map(b => ({ name: b.name, commit_sha: b.commit.sha })), null, 2) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute GitHub API call: ${e.message}` }] };
      }
    }

    if (name === 'notion_connector') {
      const { operation, query, limit = 10, pageId } = args;
      const { userEmail = '' } = context;

      const user = await mongoose.models.User.findOne({ email: userEmail });
      if (!user || (!user.notion_access_token && !user.notion_refresh_token)) {
        return { content: [{ type: 'text', text: `Error: No Notion connection found. Please connect your Notion account first.` }] };
      }

      try {
        let accessToken = user.notion_access_token;
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        };

        if (operation === 'search') {
          const res = await fetch('https://api.notion.com/v1/search', {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: query || "", page_size: limit })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.message || 'Notion API error');

          // Clean up response for AI token size
          const safeResults = (data.results || []).map(r => ({
            id: r.id,
            object: r.object,
            url: r.url,
            title: r.properties?.title?.title?.[0]?.plain_text || r.properties?.Name?.title?.[0]?.plain_text || 'Untitled'
          }));
          return { content: [{ type: 'text', text: JSON.stringify(safeResults, null, 2) }] };

        } else if (operation === 'get_page') {
          if (!pageId) throw new Error("pageId is required for get_page");
          const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
            headers
          });
          const data = await res.json();
          if (data.error) throw new Error(data.message || 'Notion API error');

          // Extract text from blocks
          const textBlocks = (data.results || []).map(b => {
            const type = b.type;
            const richText = b[type]?.rich_text || [];
            return richText.map(t => t.plain_text).join('');
          }).filter(t => t.trim() !== '');

          let outputText = textBlocks.join('\n');
          if (outputText.length > 3000) outputText = outputText.substring(0, 3000) + "\n[TRUNCATED TO SAVE CONTEXT]";

          return { content: [{ type: 'text', text: outputText || 'No readable text on this page.' }] };
        } else if (operation === 'create_page') {
          if (!args.pageId) throw new Error("pageId (parent page ID) is required for create_page");
          if (!args.title) throw new Error("title is required for create_page");

          const payload = {
            parent: { page_id: args.pageId },
            properties: {
              title: [
                {
                  text: { content: args.title }
                }
              ]
            },
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: { content: args.content || "Empty page created by Classgrid AI" }
                    }
                  ]
                }
              }
            ]
          };

          const res = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.error) throw new Error(data.message || 'Notion API error');

          return { content: [{ type: 'text', text: `Success! Created Notion page with ID: ${data.id} and URL: ${data.url}` }] };
        } else if (operation === 'update_page') {
          if (!args.pageId) throw new Error("pageId is required for update_page");
          if (!args.content) throw new Error("content is required for update_page");

          const payload = {
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: { content: args.content }
                    }
                  ]
                }
              }
            ]
          };

          const res = await fetch(`https://api.notion.com/v1/blocks/${args.pageId}/children`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.error) throw new Error(data.message || 'Notion API error');

          return { content: [{ type: 'text', text: `Success! Appended content to page/block ID: ${args.pageId}` }] };
        } else if (operation === 'add_comment') {
          if (!args.pageId) throw new Error("pageId is required for add_comment");
          if (!args.content) throw new Error("content is required for add_comment");

          const payload = {
            parent: { page_id: args.pageId },
            rich_text: [
              {
                type: 'text',
                text: { content: args.content }
              }
            ]
          };

          const res = await fetch(`https://api.notion.com/v1/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.error) throw new Error(data.message || 'Notion API error');

          return { content: [{ type: 'text', text: `Success! Added comment to page ID: ${args.pageId}` }] };
        } else if (operation === 'read_comments') {
          if (!args.pageId) throw new Error("pageId is required for read_comments");

          const res = await fetch(`https://api.notion.com/v1/comments?block_id=${args.pageId}`, {
            method: 'GET',
            headers
          });
          const data = await res.json();
          if (data.error) throw new Error(data.message || 'Notion API error');

          const comments = (data.results || []).map(c => {
            const text = c.rich_text.map(t => t.plain_text).join('');
            return `[${new Date(c.created_time).toLocaleString()}] Comment: ${text}`;
          });

          return { content: [{ type: 'text', text: comments.length > 0 ? comments.join('\n') : "No comments found." }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to execute Notion API call: ${e.message}` }] };
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

    if (name === 'read_server_logs') {
      const { log_type, lines = 100 } = args;
      const numLines = Math.min(lines, 500);
      try {
        let output = '';
        if (log_type === 'pm2_error' || log_type === 'pm2_out') {
          const stream = log_type === 'pm2_error' ? 'err' : 'out';
          const { stdout, stderr } = await execPromise(`pm2 logs --${stream} --lines ${numLines} --nostream`);
          output = stdout || stderr || 'No PM2 logs found.';
        } else if (log_type === 'winston_error' || log_type === 'winston_combined') {
          const fileName = log_type === 'winston_error' ? 'error.log' : 'combined.log';
          const logPath = path.join(process.cwd(), 'logs', fileName);
          if (!fs.existsSync(logPath)) {
            output = `Log file ${logPath} does not exist.`;
          } else {
            try {
              const { stdout } = await execPromise(`tail -n ${numLines} "${logPath}"`);
              output = stdout || `No logs in ${fileName}.`;
            } catch (tailErr) {
              // Fallback for Windows or if tail fails (reads into memory, could be heavy)
              const content = fs.readFileSync(logPath, 'utf-8');
              const fileLines = content.split('\n');
              output = fileLines.slice(-numLines).join('\n');
            }
          }
        }
        return { content: [{ type: 'text', text: output.substring(0, 50000) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Failed to read server logs: ${err.message}` }] };
      }
    }

    if (name === 'aws_ses_connector') {
      const { operation } = args;
      try {
        const sesClient = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        
        if (operation === 'get_statistics') {
          const command = new GetSendStatisticsCommand({});
          const response = await sesClient.send(command);
          return { content: [{ type: 'text', text: JSON.stringify(response.SendDataPoints, null, 2) }] };
        } else if (operation === 'list_identities') {
          const command = new ListIdentitiesCommand({ IdentityType: 'EmailAddress' });
          const response = await sesClient.send(command);
          return { content: [{ type: 'text', text: JSON.stringify(response.Identities, null, 2) }] };
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (e) {
        return { content: [{ type: 'text', text: `Failed to connect to AWS SES: ${e.message}` }] };
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
