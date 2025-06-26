import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, Clock } from 'lucide-react';
import { EnvironmentResult, ClusterMetrics, ErrorDistribution } from '../types';
import { format } from 'date-fns';

interface ReportsProps {
  environments: EnvironmentResult[];
  clusterMetrics: ClusterMetrics[];
  errorDistributions: ErrorDistribution[];
}

export function Reports({ environments, clusterMetrics, errorDistributions }: ReportsProps) {
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'pdf'>('html');
  const [showPreview, setShowPreview] = useState(false);

  const generateReport = (format: 'html' | 'pdf') => {
    // Simulate report generation
    const reportData = {
      generated: new Date(),
      environments,
      clusterMetrics,
      errorDistributions
    };

    if (format === 'html') {
      setShowPreview(true);
    } else {
      // Simulate PDF download
      console.log('Generating PDF report...', reportData);
      // In real implementation, this would generate and download a PDF
    }
  };

  const ReportPreview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Daily Production Environment Report
        </h1>
        <p className="text-gray-600">
          Generated on: {format(new Date(), 'MMMM d, yyyy \'at\' HH:mm:ss')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">
            {environments.filter(env => env.loginPage === 'Live').length}/{environments.length}
          </div>
          <div className="text-sm text-blue-600">Environments Live</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            {environments.filter(env => env.message === 'Success').length}/{environments.length}
          </div>
          <div className="text-sm text-green-600">Successful Queries</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">
            {clusterMetrics.reduce((sum, cluster) => sum + cluster.nodes, 0)}
          </div>
          <div className="text-sm text-purple-600">Total Nodes</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-700">
            {Math.max(...errorDistributions.map(err => err.errorRate24h), 0).toFixed(1)}%
          </div>
          <div className="text-sm text-red-600">Highest Error Rate</div>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Health Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Environment</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Region</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Query Time</th>
                </tr>
              </thead>
              <tbody>
                {environments.map((env) => (
                  <tr key={env.id}>
                    <td className="border border-gray-300 px-4 py-2">{env.namespace}</td>
                    <td className="border border-gray-300 px-4 py-2">{env.region}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        env.loginPage === 'Live' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {env.loginPage}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{env.queryTimeS}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cluster Metrics</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Cluster</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Region</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Nodes</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">RAM Usage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">CPU Usage</th>
                </tr>
              </thead>
              <tbody>
                {clusterMetrics.map((cluster, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{cluster.cluster}</td>
                    <td className="border border-gray-300 px-4 py-2">{cluster.region}</td>
                    <td className="border border-gray-300 px-4 py-2">{cluster.nodes}</td>
                    <td className="border border-gray-300 px-4 py-2">{cluster.ramUsage.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2">{cluster.cpuUsage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Distribution</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Namespace</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">24h Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">48h Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">72h Rate</th>
                </tr>
              </thead>
              <tbody>
                {errorDistributions.map((error, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{error.namespace}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        error.errorRate24h > 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {error.errorRate24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        error.errorRate48h > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {error.errorRate48h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        error.errorRate72h > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {error.errorRate72h.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Report Generation</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Format</h3>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="html"
                    checked={selectedFormat === 'html'}
                    onChange={(e) => setSelectedFormat(e.target.value as 'html' | 'pdf')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">HTML Report</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="pdf"
                    checked={selectedFormat === 'pdf'}
                    onChange={(e) => setSelectedFormat(e.target.value as 'html' | 'pdf')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">PDF Report</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => generateReport(selectedFormat)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selectedFormat === 'html' ? <Eye className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>{selectedFormat === 'html' ? 'Preview Report' : 'Download PDF'}</span>
              </button>

              {showPreview && (
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close Preview
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Report Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Environments:</span>
                <span className="font-medium">{environments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clusters:</span>
                <span className="font-medium">{clusterMetrics.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Records:</span>
                <span className="font-medium">{errorDistributions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Generated:</span>
                <span className="font-medium">{format(new Date(), 'HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPreview && <ReportPreview />}
    </div>
  );
}