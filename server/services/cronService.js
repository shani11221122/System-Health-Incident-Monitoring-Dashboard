const cron = require('node-cron');
const prisma = require('../prisma');
const { pingURL } = require('./Pingservice');
const redis = require('./redisClient');
const { sendAlertEmail } = require('./emailService');

// Prevents cron job overlap - if a previous run is still active, skip this tick
let isRunning = false;

async function checkMonitor(io, monitor) {
  const result = await pingURL(monitor.url);

  const previous = await redis.get(`status:${monitor.id}`);
  const statusChanged = previous && previous.status !== result.status;

  await prisma.check.create({
    data: {
      monitorId: monitor.id,
      status: result.status,
      responseTime: result.responseTime,
    },
  });

  const newStatusData = {
    status: result.status,
    responseTime: result.responseTime,
    checkedAt: new Date().toISOString(),
  };

  await redis.set(`status:${monitor.id}`, JSON.stringify(newStatusData));

  // First check ever — just set status, no incident
  if (!previous) {
    console.log(`Initial check for ${monitor.name}: ${result.status}`);
    return;
  }

  if (statusChanged) {
    console.log(`Status changed for ${monitor.name}: ${previous.status} → ${result.status}`);

    if (result.status === 'down') {
      await prisma.incident.create({
        data: { monitorId: monitor.id },
      });

      await sendAlertEmail(monitor.name, monitor.url, 'DOWN');
    }

    if (result.status === 'up') {
      const openIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          endedAt: null,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (openIncident) {
        await prisma.incident.update({
          where: { id: openIncident.id },
          data: { endedAt: new Date() },
        });

        await sendAlertEmail(monitor.name, monitor.url, 'RECOVERED');
      }
    }

    io.emit('statusChange', {
      monitorId: monitor.id,
      monitorName: monitor.name,
      ...newStatusData,
    });
  }
}

function startMonitoring(io) {
  // Schedule a lightweight job every 30 seconds to check due monitors
  cron.schedule('*/30 * * * * *', async () => {
    // Skip if the previous run is still active to prevent overlapping jobs
    // and exhausting DB connections
    if (isRunning) {
      console.log('Skipping monitoring cycle - previous run still active');
      return;
    }

    isRunning = true;
    try {
      const monitors = await prisma.monitor.findMany();

      for (const monitor of monitors) {
        const lastCheckRaw = await redis.get(`lastCheck:${monitor.id}`);
        const lastCheck = lastCheckRaw ? parseInt(lastCheckRaw) : 0;
        const now = Date.now();

        if (now - lastCheck >= monitor.interval * 1000) {
          await checkMonitor(io, monitor);
          await redis.set(`lastCheck:${monitor.id}`, String(now));
        }
      }
    } catch (error) {
      console.error('Monitoring cycle failed:', error.message);
    } finally {
      isRunning = false;
    }
  });

  // Immediate check on startup for all monitors
  setTimeout(async () => {
    try {
      const monitors = await prisma.monitor.findMany();
      for (const monitor of monitors) {
        await checkMonitor(io, monitor);
        await redis.set(`lastCheck:${monitor.id}`, String(Date.now()));
      }
    } catch (error) {
      console.error('Initial monitoring check failed:', error.message);
    }
  }, 2000);

  console.log('Monitoring started...');
}

module.exports = { startMonitoring };