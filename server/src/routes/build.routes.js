// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
import express from 'express';
import Trajectory from '../models/Trajectory.js';
import { runBuild } from '../services/controlPlane.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/build/start
// Kicks off the Control Plane for a given plan
router.post('/start', async (req, res) => {
  try {
    const { projectName, plan } = req.body;
    
    if (!projectName || !plan || !Array.isArray(plan)) {
      return res.status(400).json({ error: 'projectName and plan array are required' });
    }

    const sessionId = uuidv4(); // Generate a unique build session ID

    // Create the Trajectory in MongoDB (all steps default to pending)
    await Trajectory.create({
      sessionId,
      projectName,
      plan: plan.map(step => ({ id: step.id || step.title.toLowerCase().replace(/\s+/g, '-'), title: step.title, status: 'pending' })),
      currentIndex: 0,
      status: 'running'
    });

    // Kick off the control plane (async, don't block the request)
    runBuild(sessionId).catch(err => {
      console.error(`Background build failed for session ${sessionId}:`, err);
    });

    // Schedule watchdog alarms for each step using BullMQ
    try {
      const { alarmQueue } = await import('../queues/alarmQueue.js');
      let baseDelay = 40000; // 40 seconds for the first step
      for (let i = 0; i < plan.length; i++) {
        const step = plan[i];
        const stepId = step.id || step.title.toLowerCase().replace(/\s+/g, '-');
        await alarmQueue.add('watchdog-alarm', {
          sessionId,
          stepId,
          userEmail: req.user?.email || 'unknown',
          contextString: '' // Could add context if needed
        }, {
          delay: baseDelay + (i * 30000) // Increase delay for subsequent steps
        });
      }
      console.log(`[Build] Scheduled ${plan.length} watchdog alarms for session ${sessionId}`);
    } catch (alarmErr) {
      console.error("[Build] Failed to schedule watchdog alarms:", alarmErr);
    }

    res.json({ sessionId, status: "started" });
  } catch (error) {
    console.error('Error starting build:', error);
    res.status(500).json({ error: 'Failed to start build' });
  }
});

// GET /api/build/status/:sessionId
// Poll this endpoint from the frontend to update checkboxes
router.get('/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const trajectory = await Trajectory.findOne({ sessionId });
    
    if (!trajectory) {
      return res.status(404).json({ error: 'Trajectory not found' });
    }

    res.json({
      sessionId: trajectory.sessionId,
      projectName: trajectory.projectName,
      status: trajectory.status,
      currentIndex: trajectory.currentIndex,
      plan: trajectory.plan,
      deployedUrl: trajectory.deployedUrl || null
    });
  } catch (error) {
    console.error('Error fetching build status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
