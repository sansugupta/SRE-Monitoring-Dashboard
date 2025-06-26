import React from 'react';
import { Activity, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { EnvironmentResult, ClusterMetrics, ErrorDistribution } from '../types';

interface MetricsOverviewProps {
  environments: EnvironmentResult[];
  clusterMetrics: ClusterMetrics[];
  errorDistributions: ErrorDistribution[];
}

export function MetricsOverview({ 
  environments, 
  clusterMetrics, 
  errorDistributions 
}: MetricsOverviewProps) {
  const successfulEnvironments = environments.filter(env => env.loginPage === 'Live').length;
  const successfulQueries = environments.filter(env => env.message === 'Success').length;
  const totalNodes = clusterMetrics.reduce((sum, cluster) => sum + cluster.nodes, 0);
  const highestErrorRate = Math.max(...errorDistributions.map(err => err.errorRate24h), 0);

  const metrics = [
    {
      title: 'Environment Health',
      value: `${successfulEnvironments}/${environments.length}`,
      subtitle: 'Environments Live',
      icon: Activity,
      color: successfulEnvironments === environments.length ? 'green' : 'red',
      change: successfulEnvironments === environments.length ? '+100%' : `-${Math.round((1 - successfulEnvironments/environments.length) * 100)}%`
    },
    {
      title: 'Query Success',
      value: `${successfulQueries}/${environments.length}`,
      subtitle: 'Successful Queries',
      icon: CheckCircle,
      color: successfulQueries === environments.length ? 'green' : 'yellow',
      change: `${Math.round((successfulQueries/environments.length) * 100)}%`
    },
    {
      title: 'Total Nodes',
      value: totalNodes.toString(),
      subtitle: 'Across All Clusters',
      icon: Server,
      color: 'blue',
      change: '+12.5%'
    },
    {
      title: 'Highest Error Rate',
      value: `${highestErrorRate.toFixed(1)}%`,
      subtitle: 'Last 24 Hours',
      icon: AlertTriangle,
      color: highestErrorRate > 10 ? 'red' : highestErrorRate > 5 ? 'yellow' : 'green',
      change: highestErrorRate > 10 ? '+5.2%' : '-2.1%'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'red':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={index}
            className={`p-6 rounded-xl border ${getColorClasses(metric.color)} transition-all duration-200 hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">{metric.title}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
                <p className="text-xs opacity-60 mt-1">{metric.subtitle}</p>
              </div>
              <Icon className="w-8 h-8 opacity-60" />
            </div>
            <div className="flex items-center mt-4 space-x-2">
              <span className="text-xs font-medium">{metric.change}</span>
              <span className="text-xs opacity-50">vs last period</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}