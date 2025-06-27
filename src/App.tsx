import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { Scheduler } from './components/Scheduler';
import { Settings } from './components/Settings';
import { AlertingConfig } from './components/AlertingConfig';
import { FileManager } from './components/FileManager';
import { EnvironmentTester } from './components/EnvironmentTester';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MonitoringService } from './services/monitoringService';
import { EnvironmentResult, ClusterMetrics, ErrorDistribution, AppConfig, AlertConfig, FileConfig, AlertState } from './types';
import toast from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useLocalStorage<AppConfig>('sreConfig', {
    apiKeys: {
      logging: '',
      data: ''
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
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [alertState, setAlertState] = useLocalStorage<AlertState>('alertState', {});
  const [monitoringService, setMonitoringService] = useState<MonitoringService | null>(null);

  // Initialize monitoring service when config changes
  useEffect(() => {
    if (config.apiKeys.logging && config.credentials.email && config.credentials.password) {
      const service = new MonitoringService(config, alertConfig);
      setMonitoringService(service);
    } else {
      setMonitoringService(null);
    }
  }, [config, alertConfig]);

  const validateConfiguration = (): boolean => {
    if (!config.apiKeys.logging) {
      toast.error('Logging API key is required. Please configure it in Settings.');
      return false;
    }
    if (!config.apiKeys.data) {
      toast.error('Data API key is required. Please configure it in Settings.');
      return false;
    }
    if (!config.credentials.email || !config.credentials.password) {
      toast.error('Login credentials are required. Please configure them in Settings.');
      return false;
    }
    return true;
  };

  const handleRunTests = async (urls: string[], exclusions: string[]) => {
    if (!validateConfiguration() || !monitoringService) {
      return;
    }

    setIsRunningTests(true);
    toast.loading('Running environment tests...');

    try {
      const results = await monitoringService.runEnvironmentTests(urls, exclusions);
      
      // Convert to the format expected by the UI
      const convertedResults: EnvironmentResult[] = results.map((result, index) => ({
        id: `${index + 1}`,
        namespace: result.namespace,
        cluster: result.cluster,
        region: result.region,
        url: result.url,
        loginPage: result.loginPage,
        authorization: result.authorization,
        message: result.message,
        queryTimeS: result.queryTimeS,
        version: result.version,
        lastChecked: result.lastChecked,
        lastTransactionDate: result.lastTransactionDate
      }));

      setEnvironments(convertedResults);
      setLastUpdate(new Date());

      // Process alerts
      if (alertConfig.enabled) {
        const newAlertState = await monitoringService.processAlerts(results, alertState);
        setAlertState(newAlertState);
      }

      toast.dismiss();
      toast.success(`Environment tests completed - ${results.length} environments tested`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to run environment tests');
      console.error('Environment test error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleStartMonitoring = () => {
    if (!validateConfiguration() || !monitoringService) {
      return;
    }

    setIsMonitoring(true);
    setLastUpdate(new Date());
    toast.success('Monitoring started - running full monitoring cycle');
    
    // Run initial full monitoring
    handleRunFullMonitoring();
    
    // Set up interval for continuous monitoring
    const interval = setInterval(async () => {
      if (monitoringService) {
        try {
          const results = await monitoringService.runFullMonitoring(alertConfig.testExclusions.environments);
          
          // Convert and update state
          const convertedEnvironments: EnvironmentResult[] = results.environments.map((result, index) => ({
            id: `${index + 1}`,
            namespace: result.namespace,
            cluster: result.cluster,
            region: result.region,
            url: result.url,
            loginPage: result.loginPage,
            authorization: result.authorization,
            message: result.message,
            queryTimeS: result.queryTimeS,
            version: result.version,
            lastChecked: result.lastChecked,
            lastTransactionDate: result.lastTransactionDate
          }));

          const convertedClusterMetrics: ClusterMetrics[] = results.clusterMetrics.map(metric => ({
            cluster: metric.cluster,
            region: metric.region,
            nodes: metric.nodes,
            ramUsage: metric.ramUsage,
            cpuUsage: metric.cpuUsage,
            lastUpdated: metric.lastUpdated
          }));

          const convertedErrorDistributions: ErrorDistribution[] = results.errorDistributions.map(error => ({
            namespace: error.namespace,
            cluster: error.cluster,
            region: error.region,
            errors24h: error.errors24h,
            errorRate24h: error.errorRate24h,
            errors48h: error.errors48h,
            errorRate48h: error.errorRate48h,
            errors72h: error.errors72h,
            errorRate72h: error.errorRate72h
          }));

          setEnvironments(convertedEnvironments);
          setClusterMetrics(convertedClusterMetrics);
          setErrorDistributions(convertedErrorDistributions);
          setLastUpdate(new Date());
        } catch (error) {
          console.error('Monitoring cycle error:', error);
        }
      }
    }, 300000); // Run every 5 minutes

    // Store interval ID for cleanup
    (window as any).monitoringInterval = interval;
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    
    // Clear monitoring interval
    if ((window as any).monitoringInterval) {
      clearInterval((window as any).monitoringInterval);
      delete (window as any).monitoringInterval;
    }
    
    toast.success('Monitoring stopped');
  };

  const handleRunFullMonitoring = async () => {
    if (!validateConfiguration() || !monitoringService) {
      return;
    }

    toast.loading('Running full monitoring cycle...');
    
    try {
      const results = await monitoringService.runFullMonitoring(alertConfig.testExclusions.environments);
      
      // Convert and update state
      const convertedEnvironments: EnvironmentResult[] = results.environments.map((result, index) => ({
        id: `${index + 1}`,
        namespace: result.namespace,
        cluster: result.cluster,
        region: result.region,
        url: result.url,
        loginPage: result.loginPage,
        authorization: result.authorization,
        message: result.message,
        queryTimeS: result.queryTimeS,
        version: result.version,
        lastChecked: result.lastChecked,
        lastTransactionDate: result.lastTransactionDate
      }));

      const convertedClusterMetrics: ClusterMetrics[] = results.clusterMetrics.map(metric => ({
        cluster: metric.cluster,
        region: metric.region,
        nodes: metric.nodes,
        ramUsage: metric.ramUsage,
        cpuUsage: metric.cpuUsage,
        lastUpdated: metric.lastUpdated
      }));

      const convertedErrorDistributions: ErrorDistribution[] = results.errorDistributions.map(error => ({
        namespace: error.namespace,
        cluster: error.cluster,
        region: error.region,
        errors24h: error.errors24h,
        errorRate24h: error.errorRate24h,
        errors48h: error.errors48h,
        errorRate48h: error.errorRate48h,
        errors72h: error.errors72h,
        errorRate72h: error.errorRate72h
      }));

      setEnvironments(convertedEnvironments);
      setClusterMetrics(convertedClusterMetrics);
      setErrorDistributions(convertedErrorDistributions);
      setLastUpdate(new Date());

      toast.dismiss();
      toast.success('Full monitoring cycle completed successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Full monitoring cycle failed');
      console.error('Full monitoring error:', error);
    }
  };

  const handleManualRun = async () => {
    await handleRunFullMonitoring();
  };

  const handleRunFrequentMode = async () => {
    toast.loading('Running frequent mode...');
    await handleRunTests(config.environmentUrls, alertConfig.testExclusions.environments);
    toast.dismiss();
    toast.success('Frequent mode completed - stateful alerting processed');
  };

  const handleRunDailyMode = async () => {
    toast.loading('Running daily mode...');
    await handleRunFullMonitoring();
    
    // TODO: Generate and send daily report
    toast.dismiss();
    toast.success('Daily mode completed - full monitoring and reporting');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ((window as any).monitoringInterval) {
        clearInterval((window as any).monitoringInterval);
      }
    };
  }, []);

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
                  path="/testing" 
                  element={
                    <EnvironmentTester 
                      config={config}
                      setConfig={setConfig}
                      onRunTests={handleRunTests}
                      isRunning={isRunningTests}
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