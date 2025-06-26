import React from 'react';
import { Server, Cpu, HardDrive } from 'lucide-react';
import { ClusterMetrics } from '../types';

interface ClusterMetricsTableProps {
  clusterMetrics: ClusterMetrics[];
}

export function ClusterMetricsTable({ clusterMetrics }: ClusterMetricsTableProps) {
  const getUsageColor = (usage: number, type: 'cpu' | 'ram') => {
    const threshold = type === 'cpu' ? 80 : 85;
    if (usage > threshold) return 'text-red-600 bg-red-50';
    if (usage > threshold - 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Cluster Metrics</h3>
        <p className="text-sm text-gray-500">Resource utilization across clusters</p>
      </div>
      
      <div className="p-6">
        {clusterMetrics.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No cluster metrics available. Start monitoring to collect data.
          </div>
        ) : (
          <div className="space-y-4">
            {clusterMetrics.map((cluster, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{cluster.cluster}</h4>
                    <p className="text-xs text-gray-500">{cluster.region}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Server className="w-4 h-4" />
                    <span>{cluster.nodes} nodes</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${cluster.cpuUsage}%` }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUsageColor(cluster.cpuUsage, 'cpu')}`}>
                        {cluster.cpuUsage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <HardDrive className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">RAM Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${cluster.ramUsage}%` }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUsageColor(cluster.ramUsage, 'ram')}`}>
                        {cluster.ramUsage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}