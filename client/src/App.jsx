import { useState, useEffect } from 'react';
import socket from './socket';
import api from './api';
import AuthPage from './components/AuthPage';
import MonitorCard from './components/MonitorCard';
import MonitorForm from './components/MonitorForm';
import MonitorDetail from './components/MonitorDetail';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [viewingMonitor, setViewingMonitor] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      fetchMonitors();

      socket.on('statusChange', (data) => {
        setMonitors((prevMonitors) =>
          prevMonitors.map((monitor) =>
            monitor.id === data.monitorId
              ? {
                  ...monitor,
                  latestStatus: {
                    status: data.status,
                    responseTime: data.responseTime,
                    checkedAt: data.checkedAt,
                  },
                }
              : monitor
          )
        );
      });

      return () => {
        socket.off('statusChange');
      };
    }
  }, [user]);

  async function fetchMonitors() {
    try {
      const res = await api.get('/api/monitors/status');
      setMonitors(res.data);
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleAuth(authUser) {
    setUser(authUser);
    showToast(`Welcome, ${authUser.name}!`);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMonitors([]);
  }

  function handleSave(monitor) {
    if (editingMonitor) {
      setMonitors((prev) =>
        prev.map((m) => (m.id === monitor.id ? { ...m, ...monitor } : m))
      );
      showToast('Monitor updated successfully');
    } else {
      setMonitors((prev) => [monitor, ...prev]);
      showToast('Monitor added successfully');
    }
    setEditingMonitor(null);
  }

  function handleDelete(id) {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    showToast('Monitor deleted');
  }

  function handleEdit(monitor) {
    setEditingMonitor(monitor);
    setShowForm(true);
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-100 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold dark:text-white">Health Monitor</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-white">
            Your Monitors ({monitors.length})
          </h2>
          <button
            onClick={() => {
              setEditingMonitor(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Monitor
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : monitors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No monitors yet. Add your first monitor to start tracking!
            </p>
            <button
              onClick={() => {
                setEditingMonitor(null);
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Monitor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor.id}
                monitor={monitor}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onView={setViewingMonitor}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <MonitorForm
          monitor={editingMonitor}
          onClose={() => {
            setShowForm(false);
            setEditingMonitor(null);
          }}
          onSave={handleSave}
        />
      )}

      {viewingMonitor && (
        <MonitorDetail
          monitor={viewingMonitor}
          onClose={() => setViewingMonitor(null)}
        />
      )}
    </div>
  );
}

export default App;