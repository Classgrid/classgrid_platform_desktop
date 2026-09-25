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
