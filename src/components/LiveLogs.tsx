import React, { useState, useEffect, useRef } from 'react';
import { FileSearch, Trash2, ArrowDown } from 'lucide-react';
import { logService, LogMessage } from '../services/logService';

export function LiveLogs() {
  const [logs, setLogs] = useState<LogMessage[]>(logService.getLogs());
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewLog = (newLog: LogMessage) => {
      if (!isPaused) {
        setLogs(prevLogs => [...prevLogs, newLog]);
      }
    };

    logService.subscribe(handleNewLog);

    return () => {
      logService.unsubscribe(handleNewLog);
    };
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);
  
  const getLevelColor = (level: LogMessage['level']) => {
    switch (level) {
      case 'INFO': return 'text-blue-500';
      case 'WARN': return 'text-yellow-500';
      case 'ERROR': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <FileSearch className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Live Application Logs</h2>
        </div>
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => setIsPaused(!isPaused)}
             className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
           >
             {isPaused ? 'Resume' : 'Pause'}
           </button>
           <button
             onClick={() => setLogs([])}
             className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
             title="Clear Logs"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>
      <div ref={logContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-900 text-white font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-3">
            <span className="text-gray-500">{log.timestamp}</span>
            <span className={`${getLevelColor(log.level)} font-bold`}>{log.level.padEnd(5)}</span>
            <p className="flex-1 whitespace-pre-wrap break-all">{log.message}</p>
          </div>
        ))}
      </div>
       <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
         Displaying last {logs.length} log messages.
      </div>
    </div>
  );
}