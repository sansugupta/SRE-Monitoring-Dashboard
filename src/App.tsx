import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { Scheduler } from './components/Scheduler';
import { Settings } from './components/Settings';
import { AlertingConfig } from './components/AlertingConfig';
import { FileManager } from './components/FileManager';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
import { EnvironmentResult, ClusterMetrics, ErrorDistribution, AppConfig, AlertConfig, FileConfig } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useLocalStorage<AppConfig>('sreConfig', {
    apiKeys: {
      logging: 'Sv4ZAQmKdVrrd7K1fKj4TMALxhZWrvsA',
      data: 'p30o3dlvKYNoqqTZHoIpsUZuWwjHg8xP'
    },
    endpoints: {
      groundcoverLogging: 'https://grgrer.platform.grcv.io/json/logs',
      victoriaMetrics: 'https://ds.groundcover.com/datasources/prometheus/api/v1/query_range',
      clickhouse: 'https://ds.groundcover.com/'
    },
    environmentUrls: [
      'https://tenant-tempo2.erag-c1.gigaspaces.net',
      'https://tenant-demo.ws-use1.gigaspaces.net'
    ],
    errorDistUrls: [
      'https://tenant-tempo2.erag-c1.gigaspaces.net',
      'https://tenant-demo.ws-use1.gigaspaces.net'
    ],
    credentials: {
      email: '',
      password: ''
    },
    applicationIds: {
      default: 'ac115209-2353-4271-84f7-e2aa67090286',
      environmentSpecific: {}
    }
  });

  const [alertConfig, setAlertConfig] = useLocalStorage<AlertConfig>('alertConfig', {
    enabled: true,
    channels: {
      slack: {
        enabled: true,
        botToken: '',
        alertChannelId: 'C091MP3ECQJ',
        reportChannelId: 'C091MP3ECQJ'
      },
      email: {
        enabled: true,
        senderEmail: '',
        appPassword: '',
        recipients: ['sanskargupta966@gmail.com']
      }
    },
    thresholds: {
      queryResponseTime: 60,
      reminderInterval: 4
    },
    testExclusions: {
      environments: []
    }
  });

  const [fileConfig, setFileConfig] = useLocalStorage<FileConfig>('fileConfig', {
    baseDirectory: '/home/erag-noc/scripts/DailyReport-Script',
    files: {
      envList: '/home/erag-noc/Paras/dynamic_envs_list_genrator/prod-envs-list.txt',
      errorDistEnvs: 'error_dist_env_urls.txt',
      logo: 'logo.png',
      checkIcon: 'check-circle.png',
      timesIcon: 'times-circle.png',
      exclamationIcon: 'exclamation-circle.png'
    }
  });

  const [environments, setEnvironments] = useState<EnvironmentResult[]>([]);
  const [clusterMetrics, setClusterMetrics] = useState<ClusterMetrics[]>([]);
  const [errorDistributions, setErrorDistributions] = useState<ErrorDistribution[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [alertState, setAlertState] = useState<Record<string, any>>({});

  const generateMockData = (urls: string[]) => {
    const mockEnvironments: EnvironmentResult[] = urls.map((url, index) => {
      const urlParts = url.replace('https://', '').split('.');
      const namespace = urlParts[0] || `env-${index + 1}`;
      const cluster = urlParts[1] || `cluster-${index + 1}`;
      
      const hasIssue = Math.random() > 0.8;
      
      return {
        id: `${index + 1}`,
        namespace,
        cluster,
        region: cluster.includes('erag-c1') ? 'US' : cluster.includes('use1') ? 'US-EAST' : cluster.includes('euc1') ? 'EU' : 'US',
        url,
        loginPage: hasIssue ? 'Not Live' : 'Live',
        authorization: hasIssue ? 'Fail' : 'Success',
        message: hasIssue ? 'Fail' : 'Success',
        queryTimeS: Math.round((Math.random() * 5 + 1) * 10) / 10,
        version: `7.0.${Math.floor(Math.random() * 5)}`,
        lastChecked: new Date(),
        lastTransactionDate: hasIssue ? 'Error retrieving data' : '2025-01-15 14:30:22'
      };
    });

    const clusters = [...new Set(mockEnvironments.map(env => `${env.cluster}-gigaspaces-net`))];
    const mockClusters: ClusterMetrics[] = clusters.map(cluster => ({
      cluster,
      region: cluster.includes('erag-c1') ? 'US' : cluster.includes('use1') ? 'US-EAST' : cluster.includes('euc1') ? 'EU' : 'US',
      nodes: Math.floor(Math.random() * 15) + 5,
      ramUsage: Math.round((Math.random() * 40 + 40) * 10) / 10,
      cpuUsage: Math.round((Math.random() * 60 + 20) * 10) / 10,
      lastUpdated: new Date()
    }));

    const mockErrors: ErrorDistribution[] = mockEnvironments.map(env => ({
      namespace: env.namespace,
      cluster: `${env.cluster}-gigaspaces-net`,
      region: env.region,
      errors24h: Math.floor(Math.random() * 200) + 10,
      errorRate24h: Math.round((Math.random() * 15 + 1) * 100) / 100,
      errors48h: Math.floor(Math.random() * 400) + 20,
      errorRate48h: Math.round((Math.random() * 12 + 1) * 100) / 100,
      errors72h: Math.floor(Math.random() * 600) + 30,
      errorRate72h: Math.round((Math.random() * 10 + 1) * 100) / 100
    }));

    return { mockEnvironments, mockClusters, mockErrors };
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    setLastUpdate(new Date());
    
    // Simulate real-time monitoring
    const interval = setInterval(() => {
      if (config.environmentUrls.length > 0) {
        const { mockEnvironments, mockClusters, mockErrors } = generateMockData(config.environmentUrls);
        setEnvironments(mockEnvironments);
        setClusterMetrics(mockClusters);
        setErrorDistributions(mockErrors);
        setLastUpdate(new Date());
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
  };

  const handleManualRun = async () => {
    const urlsToCheck = config.environmentUrls.length > 0 ? config.environmentUrls : [
      'https://tenant-tempo2.erag-c1.gigaspaces.net',
      'https://tenant-demo.ws-use1.gigaspaces.net'
    ];

    setLastUpdate(new Date());
    
    const { mockEnvironments, mockClusters, mockErrors } = generateMockData(urlsToCheck);
    
    setEnvironments(mockEnvironments);
    setClusterMetrics(mockClusters);
    setErrorDistributions(mockErrors);
  };

  const handleRunFrequentMode = () => {
    // Simulate frequent mode execution (every 5 minutes)
    handleManualRun();
  };

  const handleRunDailyMode = () => {
    // Simulate daily mode execution (PDF generation)
    handleManualRun();
    // Additional logic for PDF generation would go here
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Toaster position="top-right" />
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="flex-1 ml-64">
            <Header 
              isMonitoring={isMonitoring}
              lastUpdate={lastUpdate}
              onStartMonitoring={handleStartMonitoring}
              onStopMonitoring={handleStopMonitoring}
              onManualRun={handleManualRun}
              onRunFrequentMode={handleRunFrequentMode}
              onRunDailyMode={handleRunDailyMode}
            />
            
            <main className="p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <Dashboard 
                      environments={environments}
                      clusterMetrics={clusterMetrics}
                      errorDistributions={errorDistributions}
                      isMonitoring={isMonitoring}
                      alertState={alertState}
                    />
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <Reports 
                      environments={environments}
                      clusterMetrics={clusterMetrics}
                      errorDistributions={errorDistributions}
                    />
                  } 
                />
                <Route 
                  path="/scheduler" 
                  element={
                    <Scheduler 
                      config={config} 
                      setConfig={setConfig}
                      alertConfig={alertConfig}
                      setAlertConfig={setAlertConfig}
                    />
                  } 
                />
                <Route 
                  path="/alerting" 
                  element={
                    <AlertingConfig 
                      alertConfig={alertConfig}
                      setAlertConfig={setAlertConfig}
                      alertState={alertState}
                      setAlertState={setAlertState}
                    />
                  } 
                />
                <Route 
                  path="/files" 
                  element={
                    <FileManager 
                      fileConfig={fileConfig}
                      setFileConfig={setFileConfig}
                    />
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <Settings 
                      config={config} 
                      setConfig={setConfig}
                    />
                  } 
                />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;