const express = require('express');
const router = express.Router();
const {
  createMonitor,
  getMonitors,
  updateMonitor,
  deleteMonitor,
  getStatus,
  getIncidents,
  getMonitorHistory,
  getMonitorAnalytics,
} = require('../controller/monitors');
const { validate, monitorSchema, updateMonitorSchema } = require('../middleware/validate');
const { auth } = require('../middleware/auth');

// All monitor routes require authentication.
// Applied per-route (not router.use) so this router never intercepts
// unrelated /api/* routes like /api/auth/login or /api/auth/register.
router.post('/monitors', auth, validate(monitorSchema), createMonitor);
router.get('/monitors', auth, getMonitors);
router.put('/monitors/:id', auth, validate(updateMonitorSchema), updateMonitor);
router.delete('/monitors/:id', auth, deleteMonitor);
router.get('/monitors/status', auth, getStatus);
router.get('/monitors/incidents', auth, getIncidents);
router.get('/monitors/:id/history', auth, getMonitorHistory);
router.get('/monitors/:id/analytics', auth, getMonitorAnalytics);

module.exports = router;