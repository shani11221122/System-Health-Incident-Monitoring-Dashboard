const prisma = require('../prisma');
const redis = require('../services/redisClient');
const { sendAlertEmail } = require('../services/emailService');

const getStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    const monitors = await prisma.monitor.findMany({
      where: userId ? { userId } : {},
    });

    const statuses = await Promise.all(
      monitors.map(async (monitor) => {
        const cached = await redis.get(`status:${monitor.id}`);

        return {
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          interval: monitor.interval,
          latestStatus: cached ? cached : { status: 'unknown', responseTime: null },
        };
      })
    );

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const createMonitor = async (req, res) => {
  try {
    const { name, url, interval } = req.body;
    const userId = req.user?.id;

    const monitor = await prisma.monitor.create({
      data: {
        name,
        url,
        interval: interval || 60,
        userId: userId || 1, // fallback for backward compat
      },
    });

    await sendAlertEmail(name, url, 'CREATED');

    res.status(201).json(monitor);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const getMonitors = async (req, res) => {
  try {
    const userId = req.user?.id;
    const monitors = await prisma.monitor.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(monitors);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const updateMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, interval } = req.body;
    const userId = req.user?.id;

    const existing = await prisma.monitor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    if (userId && existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this monitor' });
    }

    const monitor = await prisma.monitor.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(interval && { interval }),
      },
    });

    res.json(monitor);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const deleteMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.monitor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    if (userId && existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this monitor' });
    }

    await prisma.monitor.delete({
      where: { id: parseInt(id) },
    });

    await redis.del(`status:${id}`);

    res.json({ message: 'Monitor deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const getIncidents = async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: { monitor: true },
      orderBy: { startedAt: 'desc' },
    });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Paginated check history for a single monitor
const getMonitorHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const monitor = await prisma.monitor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const [checks, total] = await Promise.all([
      prisma.check.findMany({
        where: { monitorId: parseInt(id) },
        orderBy: { checkedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.check.count({ where: { monitorId: parseInt(id) } }),
    ]);

    res.json({
      checks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Uptime percentage + response time analytics for a monitor
const getMonitorAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const monitor = await prisma.monitor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const checks = await prisma.check.findMany({
      where: {
        monitorId: parseInt(id),
        checkedAt: { gte: since },
      },
      orderBy: { checkedAt: 'asc' },
    });

    const totalChecks = checks.length;
    const upChecks = checks.filter((c) => c.status === 'up').length;
    const uptimePercent = totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(2) : 0;

    const responseTimes = checks.map((c) => c.responseTime).filter((t) => t > 0);
    const avgResponseTime = responseTimes.length
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(0)
      : 0;
    const minResponseTime = responseTimes.length ? Math.min(...responseTimes) : 0;
    const maxResponseTime = responseTimes.length ? Math.max(...responseTimes) : 0;

    res.json({
      monitorId: monitor.id,
      periodDays: days,
      totalChecks,
      upChecks,
      downChecks: totalChecks - upChecks,
      uptimePercent: parseFloat(uptimePercent),
      avgResponseTime: parseInt(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      checks: checks.slice(-100), // last 100 points for charts
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = {
  createMonitor,
  getMonitors,
  updateMonitor,
  deleteMonitor,
  getStatus,
  getIncidents,
  getMonitorHistory,
  getMonitorAnalytics,
};