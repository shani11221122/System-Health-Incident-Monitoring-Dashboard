import { useState } from 'react';
import api from '../api';

function MonitorCard({ monitor, onDelete, onEdit, onView }) {
  const [deleting, setDeleting] = useState(false);
  const status = monitor.latestStatus?.status || 'unknown';
  const responseTime = monitor.latestStatus?.responseTime;

  const statusColors = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-400',
  };

  const statusText = {
    up: 'Operational',
    down: 'Down',
    unknown: 'Unknown',
  };

  async function handleDelete() {
    if (!confirm(`Delete monitor "${monitor.name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/api/monitors/${monitor.id}`);
      onDelete(monitor.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${statusColors[status]}`}></span>
          <h2 className="font-semibold">{monitor.name}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(monitor)}
            className="text-sm text-blue-600 hover:underline"
          >
            Details
          </button>
          <button
            onClick={() => onEdit(monitor)}
            className="text-sm text-gray-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-2 break-all">{monitor.url}</p>

      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${
          status === 'up' ? 'text-green-600' : status === 'down' ? 'text-red-600' : 'text-gray-500'
        }`}>
          {statusText[status]}
        </span>
        {responseTime && (
          <span className="text-gray-500">{responseTime}ms</span>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Interval: {monitor.interval || 60}s
      </div>
    </div>
  );
}

export default MonitorCard;