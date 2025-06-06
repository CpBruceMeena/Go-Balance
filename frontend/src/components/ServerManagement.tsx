import { useState, useEffect } from 'react';
import type { Server, AddServerRequest } from '../services/loadBalancerService';
import { loadBalancerService } from '../services/loadBalancerService';
import { colors } from '../theme/colors';

const ServerManagement = () => {
  const [servers, setServers] = useState<Record<string, Server>>({});
  const [newServer, setNewServer] = useState<AddServerRequest>({
    url: '',
    weight: 1,
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh stats every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const stats = await loadBalancerService.getStats();
      setServers(stats);
    } catch (err) {
      setError('Failed to fetch server stats');
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loadBalancerService.addServer(newServer);
      setNewServer({ url: '', weight: 1 });
      fetchStats();
    } catch (err) {
      setError('Failed to add server');
    }
  };

  const handleRemoveServer = async (serverId: string) => {
    try {
      await loadBalancerService.removeServer(serverId);
      fetchStats();
    } catch (err) {
      setError('Failed to remove server');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>
        Server Management
      </h2>
      
      {error && (
        <div className="border px-4 py-3 rounded mb-4" style={{ 
          backgroundColor: colors.linen,
          borderColor: colors.linen,
          color: colors.primary
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleAddServer} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={newServer.url}
            onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
            placeholder="Server URL"
            className="flex-1 p-2 rounded"
            style={{ 
              backgroundColor: colors.linen,
              color: colors.primary,
              border: `1px solid ${colors.timberwolf}`
            }}
            required
          />
          <input
            type="number"
            value={newServer.weight}
            onChange={(e) => setNewServer({ ...newServer, weight: Number.parseInt(e.target.value, 10) })}
            placeholder="Weight"
            className="w-24 p-2 rounded"
            style={{ 
              backgroundColor: colors.linen,
              color: colors.primary,
              border: `1px solid ${colors.timberwolf}`
            }}
            min="1"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 rounded"
            style={{ 
              backgroundColor: colors.timberwolf,
              color: colors.primary,
              border: `1px solid ${colors.timberwolf}`
            }}
          >
            Add Server
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {Object.entries(servers).map(([id, server]) => (
          <div
            key={id}
            className="rounded p-4 flex justify-between items-center"
            style={{ 
              backgroundColor: colors.linen,
              border: `1px solid ${colors.timberwolf}`
            }}
          >
            <div>
              <h3 className="font-bold" style={{ color: colors.primary }}>
                {server.url}
              </h3>
              <p className="text-sm" style={{ color: colors.timberwolf }}>
                Weight: {server.weight} | Status:{' '}
                <span
                  style={{
                    color: server.isActive ? colors.primary : colors.champagnePink
                  }}
                >
                  {server.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <div className="text-sm mt-2" style={{ color: colors.timberwolf }}>
                <p>Total Requests: {server.stats.totalRequests}</p>
                <p>Active Requests: {server.stats.activeRequests}</p>
                <p>Failed Requests: {server.stats.failedRequests}</p>
                <p>
                  Last Response Time: {server.stats.lastResponseTime}ms
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveServer(id)}
              className="px-3 py-1 rounded"
              style={{ 
                backgroundColor: colors.champagnePink,
                color: colors.primary,
                border: `1px solid ${colors.champagnePink}`
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServerManagement; 