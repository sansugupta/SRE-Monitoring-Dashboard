import React from 'react';
import { Play, Square, RefreshCw, Clock, Zap, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  isMonitoring: boolean;
  lastUpdate: Date | null;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  onManualRun: () => void;
  onRunFrequentMode: () => void;
  onRunDailyMode: () => void;
}

export function Header({ 
  isMonitoring, 
  lastUpdate, 
  onStartMonitoring, 
  onStopMonitoring, 
  onManualRun,
  onRunFrequentMode,
  onRunDailyMode
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced SRE Monitor</h2>
          <p className="text-gray-600 mt-1">Real-time monitoring, alerting, and reporting dashboard</p>
        </div>

        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {format(lastUpdate, 'HH:mm:ss')}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {!isMonitoring ? (
              <button
                onClick={onStartMonitoring}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Monitoring</span>
              </button>
            ) : (
              <button
                onClick={onStopMonitoring}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Stop Monitoring</span>
              </button>
            )}

            <button
              onClick={onManualRun}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Manual Run</span>
            </button>

            <button
              onClick={onRunFrequentMode}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Frequent Mode</span>
            </button>

            <button
              onClick={onRunDailyMode}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Daily Mode</span>
            </button>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isMonitoring ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}