import React from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/marketing_ui/toggle-group';
import { AgentStepper } from '@/components/ai/components/stepper/AgentStepper';
import { AgentStepAccordion } from '@/components/ai/components/stepper/AgentStepAccordion';
import { ThoughtStepView } from '@/components/ai/components/stepper/ThoughtStepView';
import { TerminalToolView } from '@/components/ai/components/stepper/TerminalToolView';
import { DatabaseQueryView } from '@/components/ai/components/stepper/DatabaseQueryView';
import { DocumentGenerationView } from '@/components/ai/components/stepper/DocumentGenerationView';
import { EmailSentView } from '@/components/ai/components/stepper/EmailSentView';
import { FileActionView } from '@/components/ai/components/stepper/FileActionView';
import { KnowledgeBaseSearchView } from '@/components/ai/components/stepper/KnowledgeBaseSearchView';
import { SimpleLogStepView } from '@/components/ai/components/stepper/SimpleLogStepView';
import { WebSearchView } from '@/components/ai/components/stepper/WebSearchView';
import { EmailActionView } from '@/components/ai/components/stepper/EmailActionView';
import { WorkflowAccordion, WorkflowStep } from '@/components/ai/components/stepper/WorkflowAccordion';
import { CdnUploadView } from '@/components/ai/components/stepper/CdnUploadView';
import { Terminal, Database, UploadCloud, Globe, FileText, Mail, Plane, Network } from 'lucide-react';

const MASSIVE_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    type: 'thought',
    title: "Executing user request",
    details: "I need to tackle the latest request by executing the workflow within my native workspace. It looks like I should research the content and load skills related to complex bulk notion and data analysis, especially if the user wants me to synthesize 20 notes in-depth. I want to check the specific documentation for meeting notes and confirm if I can autonomously handle the entire workflow or if I need confirmation before assignment. I should also explore meeting query tools."
  },
  { id: 2, type: 'log', text: "Loaded tools" },
  { id: 3, type: 'log', text: "Loaded research skill" },
  { id: 4, type: 'log', text: "Loaded data-analysis skill" },
  { id: 5, type: 'log', text: "Loaded notion-scriptable-actions skill" },
  { id: 6, type: 'log', text: "Updated to-dos" },
  {
    id: 7,
    type: 'thought',
    title: "Inspecting meeting notes",
    details: "I'm considering querying all meeting notes, which might return over 20 results without any filters. That's a lot of information to sort through! Maybe I should check the documentation for the skills index to see if there's a better approach or if there's anything specific I need to focus on. I want to make sure I'm efficient about it, so I can find exactly what I need without getting overwhelmed."
  },
  { id: 8, type: 'log', text: "Loaded tools" },
  { id: 9, type: 'log', text: "Queried meetings" },
  {
    id: 10,
    type: 'knowledge_search',
    results: [
      { title: "API v2 Migration", source: "Classgrid's HQ / Projects", icon: 'network' },
      { title: "New doc", source: "Classgrid's HQ / Docs" },
      { title: "New task", source: "Classgrid's HQ / Tasks" },
      { title: "List all internal capabilities" },
      { title: "New project", source: "Classgrid's HQ / Projects" },
      { title: "My Notion AI" },
      { title: "Your first doc", source: "Classgrid's HQ / Docs" }
    ]
  },
  { id: 11, type: 'thought', title: "", details: "" },
  { id: 12, type: 'log', text: "Loaded page Mobile App Launch", icon: 'plane' },
  { id: 13, type: 'log', text: "Loaded page Meeting @Wednesday 6:14 PM - Brief Demo of Meeting Notes Recording Tool @Wednesday", icon: 'file' },
  { id: 14, type: 'log', text: "Loaded page Your first meeting - Meeting @Monday", icon: 'file' },
  {
    id: 15,
    type: 'knowledge_search',
    results: [
      { title: "Mobile App Launch", source: "Classgrid's HQ / Projects", icon: 'plane' },
      { title: "API v2 Migration", source: "Classgrid's HQ / Projects", icon: 'network' },
      { title: "Scope push notification service", source: "Classgrid's HQ / Tasks" },
      { title: "Meeting @Wednesday 6:14 PM", source: "Classgrid's HQ / Meetings" }
    ]
  },
  { id: 16, type: 'thought', title: "", details: "" },
  { id: 17, type: 'thought', title: "", details: "" },
  { id: 18, type: 'thought', title: "", details: "" },
  { id: 19, type: 'log', text: "Loaded page Scope push notification service", icon: 'file' },
  { id: 20, type: 'log', text: "Loaded page Scope push notification service", icon: 'file' },
  { id: 21, type: 'log', text: "Loading database" },
  { id: 22, type: 'log', text: "Creating page" },
  { id: 23, type: 'log', text: "Creating database" }
];

export function AgentUISandboxPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen w-full bg-background text-foreground relative p-8 transition-colors duration-200">
      
      {/* Sleek Segmented Theme Toggle Button (Top Right) */}
      <div className="absolute top-4 right-4 bg-card border border-border rounded-full p-1 shadow-sm">
        <ToggleGroup 
          type="single" 
          value={theme} 
          onValueChange={(val) => {
            if (val) setTheme(val);
          }}
          className="gap-1"
        >
          <ToggleGroupItem value="system" aria-label="System" className="rounded-full h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <Monitor className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="light" aria-label="Light" className="rounded-full h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <Sun className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark" className="rounded-full h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <Moon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Container (Wider so text doesn't truncate) */}
      <div className="max-w-[700px] mx-auto pt-16 space-y-4">
        
        {/* --- WORKFLOW 1: DISCIPLINARY EMAIL --- */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 1: Disciplinary Email & Document Generation
          </h2>
          <AgentStepper>
            {/* 1. First Thought */}
            <ThoughtStepView 
              title="Evaluating request"
              details="The user wants me to identify the students involved in the cafeteria incident, cross-reference their records, search for the school's disciplinary guidelines, draft an email to their parents, send it, and finally generate an official PDF warning letter."
            />
            
            {/* 2. Database Query */}
            <AgentStepAccordion 
              title="Querying database" 
              status="success" 
              defaultExpanded={false}
            >
              <DatabaseQueryView 
                query='db.students.find({ incidents: "cafeteria_fight" })\n  .select({ name: 1, parentsEmail: 1 })'
                results={[
                  {
                    _id: "stu_1",
                    name: "Student 1",
                    parentsEmail: "student1@demo.edu"
                  },
                  {
                    _id: "stu_2",
                    name: "Student 2",
                    parentsEmail: "student2@demo.edu"
                  }
                ]}
              />
            </AgentStepAccordion>

            {/* 3. Web Search */}
            <AgentStepAccordion 
              title="Searched the web" 
              status="success" 
              defaultExpanded={false}
            >
              <WebSearchView 
                query="Classgrid demo school disciplinary guidelines for suspension"
                searchDomain="classgrid.in"
                results={[
                  {
                    title: "Student Code of Conduct & Disciplinary Guidelines",
                    url: "https://demo.classgrid.in/guidelines/conduct"
                  },
                  {
                    title: "Temporary Suspension Policy | Parent Handbook",
                    url: "https://demo.classgrid.in/parents/suspension-policy"
                  }
                ]}
              />
            </AgentStepAccordion>

            {/* 4. Drafted Email */}
            <AgentStepAccordion 
              title="Drafted email" 
              status="success" 
              defaultExpanded={false}
            >
              <EmailActionView 
                to={Array.from({ length: 50 }, (_, i) => `student${i + 1}@demo.edu`).join(', ')}
                subject="URGENT: Regarding the latest disciplinary action"
                bodyPreview={`Dear Principal and Parents,\n\nI am writing to inform you that following the recent incident in the cafeteria, we have decided to implement a temporary suspension for the student involved.\n\nPlease refer to the attached documentation for full details on the incident report and the school board's disciplinary guidelines.\n\nBest regards,\nClassgrid AI Assistant`}
              />
            </AgentStepAccordion>

            {/* 5. Sent Email */}
            <AgentStepAccordion 
              title="Sent email" 
              status="success" 
              defaultExpanded={true}
            >
              <EmailSentView 
                toCount={50}
                subject="URGENT: Regarding the latest disciplinary action"
              />
            </AgentStepAccordion>

            {/* 6. Generated PDF */}
            <AgentStepAccordion 
              title="Generated PDF document" 
              status="success" 
              defaultExpanded={true}
            >
              <DocumentGenerationView 
                fileName="official_warning_letter.pdf"
                pageCount={3}
                size="1.2 MB"
              />
            </AgentStepAccordion>
          </AgentStepper>
        </div>

        {/* --- WORKFLOW 2: PDF OCR --- */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 2: PDF OCR Analysis
          </h2>
          <AgentStepper>
            {/* 1. First Thought */}
            <ThoughtStepView 
              title="Evaluating PDF attachment"
              details="I need to read the attached PDF, but it looks like there's no textual content, just an image on the first page. I'll probably need to use a computer to inspect it. The first step is uploading the attachment for analysis. It seems that I might need OCR to extract any possible information. Since the second page is blank, I need to focus on the first. I guess I may also be able to use OCR if necessary."
            />

            {/* 2. Read Document */}
            <AgentStepAccordion 
              title="Uploaded File" 
              status="success" 
              defaultExpanded={true}
            >
              <FileActionView 
                fileName="e288b93c-17cb-4661-a3f1-8c073016a962.pdf"
              />
            </AgentStepAccordion>
            
            {/* 3. Second Thought (OCR) */}
            <ThoughtStepView 
              title="Continuing with OCR process"
              details="I want to keep going with the terminal OCR now. There's no need to read any documentation since I've already indexed it earlier. So, I'm just going to call the terminal. It's straightforward from here. I'll make sure to execute the right commands to get the OCR process moving. Let's see how it goes!"
            />

            {/* 4. Terminal Command */}
            <AgentStepAccordion 
              title="OCR the attached identity card" 
              status="success" 
              defaultExpanded={true}
            >
              <TerminalToolView 
                command="mkdir -p /data/id_pages && pdftoppm -png /data/e288b93c-17cb-4661-a3f1-8c073016a962.pdf /data/id_pages/page"
                output="--- /data/id_pages/page-1.png ---\n--- /data/id_pages/page-2.png ---"
              />
            </AgentStepAccordion>
              </AgentStepper>
            </div>
          {/* --- WORKFLOW 3: STANDALONE PDF GENERATION --- */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 3: Standalone PDF Generation
          </h2>
          <AgentStepper>
            {/* 1. First Thought */}
            <ThoughtStepView 
              title="Processing request"
              details="The user requested to generate a summary report of the recent school board meeting. I will format the notes and generate a clean PDF document for them to download."
            />

            {/* 2. Generated PDF */}
            <AgentStepAccordion 
              title="Generated PDF document" 
              status="success" 
              defaultExpanded={true}
            >
              <DocumentGenerationView 
                fileName="board_meeting_summary.pdf"
                pageCount={5}
                size="2.4 MB"
              />
            </AgentStepAccordion>
          </AgentStepper>
        </div>

        {/* --- WORKFLOW 4: LARGE WEB SEARCH --- */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 4: Large Web Search
          </h2>
          <AgentStepper>
            {/* 1. First Thought */}
            <ThoughtStepView 
              title="Broad research query"
              details="The user asked for a comprehensive list of all recent AI developments. I will perform a broad web search and gather a large number of sources to cross-reference."
            />

            {/* 2. Web Search (15 Results) */}
            <AgentStepAccordion 
              title="Searched the web" 
              status="success" 
              defaultExpanded={true}
            >
              <WebSearchView 
                query="Latest breakthroughs in Artificial Intelligence 2026"
                searchDomain="news"
                results={Array.from({ length: 15 }, (_, i) => ({
                  title: `AI Breakthrough #${i + 1}: Important new research paper published by leading lab.`,
                  url: `https://news.example.com/ai-breakthrough-${i + 1}`
                }))}
              />
            </AgentStepAccordion>
          </AgentStepper>
        </div>

        {/* --- WORKFLOW 5: KNOWLEDGE BASE SEARCH --- */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 5: Internal Knowledge Base Search (RAG)
          </h2>
          <AgentStepper>
            {/* 1. First Thought */}
            <ThoughtStepView 
              title="Searching internal docs"
              details="The user asked for the internal vacation policy. I will search our internal knowledge base (RAG) to find the relevant employee handbook and policy documents."
            />

            {/* 2. Knowledge Base Search */}
            <AgentStepAccordion 
              title="Searched Knowledge Base" 
              status="success" 
              defaultExpanded={true}
            >
              <KnowledgeBaseSearchView 
                query="Employee vacation policy and PTO accrual 2026"
                results={[
                  {
                    title: "Employee Handbook 2026 - Section 4: Paid Time Off",
                    source: "Internal Documents / HR"
                  },
                  {
                    title: "PTO Accrual Rates by Tenure",
                    source: "Confluence / Company Policies"
                  },
                  {
                    title: "How to request time off in Workday",
                    source: "IT Helpdesk / Guides"
                  }
                ]}
              />
            </AgentStepAccordion>
          </AgentStepper>
        </div>

        {/* --- WORKFLOW 6: MASSIVE 23-STEP RAG EXECUTION --- */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 6: Massive 23-Step Execution
          </h2>
          <WorkflowAccordion 
            title="Massive 23-step RAG Workflow" 
            steps={MASSIVE_WORKFLOW_STEPS} 
            defaultExpanded={true} 
          />
        </div>

        {/* --- WORKFLOW 7: CDN FILE UPLOAD --- */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#eeeeee] mb-6 border-b border-border pb-2">
            Workflow 7: Uploading to CDN
          </h2>
          <AgentStepper>
            {/* 1. First Thought */}
            <ThoughtStepView 
              title="Preparing file for external storage"
              details="I need to upload the generated meeting notes to the public CDN bucket so it can be safely linked in the external email we send out."
            />

            {/* 2. CDN Upload */}
            <AgentStepAccordion 
              title="Upload file to CDN" 
              status="success" 
              defaultExpanded={true}
              icon={<UploadCloud />}
            >
              <CdnUploadView 
                fileName="meeting_notes_august.pdf" 
                fileSize="1.2 MB" 
                url="https://cdn.classgrid.com/files/meeting_notes_august.pdf" 
              />
            </AgentStepAccordion>
          </AgentStepper>
        </div>

      </div>
    </div>
  );
}
