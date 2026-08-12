import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import api from '../api';

function MonitorDetail({ monitor, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchData();
  }, [days]);

  async function fetchData() {
    setLoading(true);
    try {
      const [analyticsRes, historyRes] = await Promise.all([
        api.get(`/api/monitors/${monitor.id}/analytics?days=${days}`),
        api.get(`/api/monitors/${monitor.id}/history?limit=50`),
      ]);
      setAnalytics(analyticsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to fetch monitor details:', err);
    } finally {
      setLoading(false);
    }
  }

  const chartData = analytics?.checks?.map((check) => ({
    time: new Date(check.checkedAt).toLocaleTimeString(),
    responseTime: check.responseTime,
    status: check.status,
  })) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{monitor.name}</h2>
            <p className="text-gray-500 text-sm break-all">{monitor.url}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ) : analytics ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.uptimePercent}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold">{analytics.avgResponseTime}ms</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Min / Max</p>
                <p className="text-2xl font-bold">
                  {analytics.minResponseTime} / {analytics.maxResponseTime}ms
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Checks</p>
                <p className="text-2xl font-bold">
                  {analytics.totalChecks}
                  <span className="text-sm text-gray-500 font-normal">
                    {' '}({analytics.upChecks} up / {analytics.downChecks} down)
                  </span>
                </p>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex gap-2 mb-6">
              {[1, 7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    days === d
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {d} day{d > 1 ? 's' : ''}
                </button>
              ))}
            </div>

            {/* Response time chart */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Response Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3b82f6"
                      fill="#93c5fd"
                      name="Response (ms)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status chart */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Status Over Time</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 1]} ticks={[0, 1]} />
                    <Tooltip />
                    <Line
                      type="stepAfter"
                      dataKey="status"
                      stroke="#10b981"
                      dot={false}
                      name="Status"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History table */}
            {history && (
              <div>
                <h3 className="font-semibold mb-3">Recent Checks</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Time</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.checks.slice(0, 20).map((check) => (
                        <tr key={check.id} className="border-b">
                          <td className="py-2">
                            {new Date(check.checkedAt).toLocaleString()}
                          </td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                check.status === 'up'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {check.status}
                            </span>
                          </td>
                          <td className="py-2">{check.responseTime}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500">Failed to load monitor details.</p>
        )}
      </div>
    </div>
  );
}

export default MonitorDetail;