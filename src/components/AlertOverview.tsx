import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Bell } from 'lucide-react';
import { AlertState } from '../types';

interface AlertOverviewProps {
  alertState: AlertState;
}

export function AlertOverview({ alertState }: AlertOverviewProps) {
  const ongoingAlerts = Object.entries(alertState).filter(([_, state]) => state.status === 'FAIL');
  const totalTests = Object.keys(alertState).length;
  const passingTests = totalTests - ongoingAlerts.length;

  if (totalTests === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Alert Status</h3>
        </div>
        <p className="text-blue-700 mt-2">No monitoring data available. Start monitoring to see alert status.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Alert Overview</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Passing Tests</span>
            </div>
            <p className="text-2xl font-bold text-green-700 mt-2">{passingTests}</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Failing Tests</span>
            </div>
            <p className="text-2xl font-bold text-red-700 mt-2">{ongoingAlerts.length}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Total Tests</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 mt-2">{totalTests}</p>
          </div>
        </div>

        {ongoingAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Active Alerts ({ongoingAlerts.length})</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ongoingAlerts.map(([testKey, state]) => (
                <div key={testKey} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{testKey}</span>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">FAILING</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Environment: {state.namespace} • Cluster: {state.cluster}
                    </p>
                    {state.reason && (
                      <p className="text-xs text-red-600 mt-1">Reason: {state.reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Since: {state.firstFailureTimestamp ? 
                        new Date(state.firstFailureTimestamp).toLocaleString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ongoingAlerts.length === 0 && totalTests > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-green-900">All Tests Passing</h4>
            <p className="text-green-700 text-sm">No active alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}