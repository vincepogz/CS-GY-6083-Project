'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

interface TableCheck {
  table: string;
  exists: boolean;
  error?: string;
}

interface HealthResponse {
  connectionStatus: 'connected' | 'failed';
  tableChecks?: TableCheck[];
  message?: string;
  error?: string;
}

export default function TestDB() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [tableChecks, setTableChecks] = useState<TableCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const tablesToCheck = ['account', 'identity', 'login', 'membership', 'security'];

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/health');
      const data: HealthResponse = await response.json();

      setConnectionStatus(data.connectionStatus);
      if (data.tableChecks) {
        setTableChecks(data.tableChecks);
      }
      if (data.message) {
        setErrorMessage(data.message);
      }
      if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setConnectionStatus('failed');
      setErrorMessage('Failed to check database health');
    }
  };

  const checkTables = async () => {
    setIsLoading(true);
    // Tables are already checked in the initial connection check
    // Just refresh the data
    await checkConnection();
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-4">
      <main className="flex flex-1 w-full max-w-2xl flex-col items-center justify-center py-16 px-8 sm:py-32 sm:px-16 bg-white dark:bg-black rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-black dark:text-zinc-50">Database Connection Test</h1>

        {/* Connection Status */}
        <div className="w-full mb-6">
          <h2 className="text-lg font-medium mb-2 text-black dark:text-zinc-50">Connection Status</h2>
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {connectionStatus === 'checking' && 'Checking connection...'}
              {connectionStatus === 'connected' && 'Connected to Neon DB'}
              {connectionStatus === 'failed' && 'Failed to connect'}
            </span>
          </div>
          {errorMessage && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errorMessage}</p>
          )}
        </div>

        {/* Table Check Button */}
        <div className="w-full mb-6">
          <button
            onClick={checkTables}
            disabled={isLoading || connectionStatus !== 'connected'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Checking Tables...' : 'Refresh Table Check'}
          </button>
        </div>

        {/* Table Results */}
        {tableChecks.length > 0 && (
          <div className="w-full">
            <h2 className="text-lg font-medium mb-4 text-black dark:text-zinc-50">Table Status</h2>
            <div className="space-y-3">
              {tableChecks.map((check) => (
                <div key={check.table} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        check.exists ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-medium text-black dark:text-zinc-50">{check.table}</span>
                  </div>
                  <div className="text-sm">
                    {check.exists ? (
                      <span className="text-green-600 dark:text-green-400">Exists</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        {check.error ? `Error: ${check.error}` : 'Does not exist'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="w-full mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Expected Tables:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• account</li>
            <li>• identity</li>
            <li>• login</li>
            <li>• membership</li>
            <li>• security</li>
          </ul>
        </div>
      </main>
    </div>
  );
}