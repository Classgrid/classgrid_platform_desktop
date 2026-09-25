import { Worker } from 'bullmq';
import Trajectory from '../models/Trajectory.js';
import Artifact from '../models/Artifact.js';
import { generateGeminiResponse } from '../services/ai/gemini.js'; // Assuming this is your AI entry point
import dotenv from 'dotenv';
dotenv.config();

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const buildWorker = new Worker('build-steps', async (job) => {
  const { sessionId, stepId, stepTitle, instructions } = job.data;
  console.log(`[Worker] Picked up job for session ${sessionId} - Step: ${stepTitle} (${stepId})`);

  try {
    // 1. Call the AI for ONE step only (Stateless call)
    // We strictly instruct it to output ONLY the required code.
    const strictPrompt = `Execute step: ${stepTitle}. Output ONLY the code for ${stepId}. Do not output any other steps, preamble, markdown formatting ticks (unless it is exactly the code block), or explanations.`;
    
    console.log(`[Worker] Calling AI for step: ${stepId}...`);
    const codeResponse = await generateGeminiResponse([
      { role: 'user', content: strictPrompt + (instructions ? `\n\nContext: ${instructions}` : '') }
    ]);
    
    // Clean up the code response if it includes markdown backticks
    let cleanCode = codeResponse;
    if (cleanCode.startsWith('```')) {
      const lines = cleanCode.split('\n');
      lines.shift(); // remove opening ```lang
      if (lines[lines.length - 1].startsWith('```')) {
        lines.pop(); // remove closing ```
      }
      cleanCode = lines.join('\n');
    }

    // 2. Save the result to the Artifact store
    console.log(`[Worker] Saving artifact for ${stepId}...`);
    await Artifact.findOneAndUpdate(
      { sessionId, stepId },
      { content: cleanCode },
      { upsert: true, new: true }
    );

    // 3. Mark the step done in the Trajectory
    console.log(`[Worker] Marking step ${stepId} as done in Trajectory...`);
    await Trajectory.findOneAndUpdate(
      { sessionId, "plan.id": stepId },
      { $set: { "plan.$.status": "done" } }
    );

    console.log(`[Worker] Job for ${stepId} completed successfully.`);
    return { ok: true, stepId };

  } catch (error) {
    console.error(`[Worker] Job failed for ${stepId}:`, error);
    await Trajectory.findOneAndUpdate(
      { sessionId, "plan.id": stepId },
      { 
        $set: { 
          "plan.$.status": "failed",
          "plan.$.error": error.message 
        } 
      }
    );
    throw error; // Let BullMQ handle retries if configured
  }
}, { connection: redisOptions });

buildWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});
