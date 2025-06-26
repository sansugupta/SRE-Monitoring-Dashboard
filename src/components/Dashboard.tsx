import React from 'react';
import { EnvironmentTable } from './EnvironmentTable';
import { ClusterMetricsTable } from './ClusterMetricsTable';
import { ErrorDistributionTable } from './ErrorDistributionTable';
import { MetricsOverview } from './MetricsOverview';
import { AlertOverview } from './AlertOverview';
import { EnvironmentResult, ClusterMetrics, ErrorDistribution, AlertState } from '../types';

interface DashboardProps {
  environments: EnvironmentResult[];
  clusterMetrics: ClusterMetrics[];
  errorDistributions: ErrorDistribution[];
  isMonitoring: boolean;
  alertState: AlertState;
}

export function Dashboard({ 
  environments, 
  clusterMetrics, 
  errorDistributions, 
  isMonitoring,
  alertState 
}: DashboardProps) {
  return (
    <div className="space-y-6">
      <MetricsOverview 
        environments={environments}
        clusterMetrics={clusterMetrics}
        errorDistributions={errorDistributions}
      />
      
      <AlertOverview alertState={alertState} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <EnvironmentTable environments={environments} />
        </div>
        
        <div className="space-y-6">
          <ClusterMetricsTable clusterMetrics={clusterMetrics} />
        </div>
      </div>
      
      <ErrorDistributionTable errorDistributions={errorDistributions} />
    </div>
  );
}