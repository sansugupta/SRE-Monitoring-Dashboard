import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { ErrorDistribution } from '../types';

interface ErrorDistributionTableProps {
  errorDistributions: ErrorDistribution[];
}

export function ErrorDistributionTable({ errorDistributions }: ErrorDistributionTableProps) {
  const getErrorRateColor = (rate: number, timeframe: '24h' | '48h' | '72h') => {
    const threshold = timeframe === '24h' ? 10 : 5;
    if (rate > threshold) return 'text-red-600 bg-red-50';
    if (rate > threshold / 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-3 h-3 text-red-500" />;
    if (current < previous) return <TrendingDown className="w-3 h-3 text-green-500" />;
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Error Distribution</h3>
        </div>
        <p className="text-sm text-gray-500">Error rates across namespaces (last 72 hours)</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Namespace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cluster
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                24h Errors / Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                48h Errors / Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                72h Errors / Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {errorDistributions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No error distribution data available. Run monitoring to collect error metrics.
                </td>
              </tr>
            ) : (
              errorDistributions.map((error, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                        {error.namespace}
                      </div>
                      <div className="text-sm text-gray-500">{error.region}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{error.cluster}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{error.errors24h}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getErrorRateColor(error.errorRate24h, '24h')}`}>
                        {error.errorRate24h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{error.errors48h}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getErrorRateColor(error.errorRate48h, '48h')}`}>
                        {error.errorRate48h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{error.errors72h}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getErrorRateColor(error.errorRate72h, '72h')}`}>
                        {error.errorRate72h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(error.errorRate24h, error.errorRate48h)}
                      <span className="text-xs text-gray-500">
                        {error.errorRate24h > error.errorRate48h ? 'Increasing' : 'Decreasing'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}