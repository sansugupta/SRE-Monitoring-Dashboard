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
import { LiveLogs } from './components/LiveLogs'; // Import new component
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MonitoringService } from './services/monitoringService';
import { EnvironmentResult, ClusterMetrics, ErrorDistribution, AppConfig, AlertConfig, FileConfig, AlertState } from './types';
import toast from 'react-hot-toast';
import { logService } from './services/logService';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [config, setConfig] = useLocalStorage<AppConfig>('sreConfig', {
    apiKeys: { logging: '', data: '' },
    endpoints: {
      groundcoverLogging: 'https://grgrer.platform.grcv.io/json/logs',
      victoriaMetrics: 'https://ds.groundcover.com/datasources/prometheus/api/v1/query_range',
      clickhouse: 'https://ds.groundcover.com/'
    },
    environmentUrls: [],
    errorDistUrls: [],
    credentials: { email: '', password: '' },
    applicationIds: { default: 'ac115209-2353-4271-84f7-e2aa67090286', environmentSpecific: {} }
  });

  const [alertConfig, setAlertConfig] = useLocalStorage<AlertConfig>('alertConfig', {
    enabled: true,
    channels: {
      slack: { enabled: true, botToken: '', alertChannelId: 'C091MP3ECQJ', reportChannelId: 'C091MP3ECQJ' },
      email: { enabled: true, senderEmail: '', appPassword: '', recipients: ['sanskargupta966@gmail.com'] }
    },
    thresholds: { queryResponseTime: 60, reminderInterval: 4 },
    testExclusions: { environments: [] }
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

  useEffect(() => {
    if (config.apiKeys.logging && config.credentials.email && config.credentials.password) {
      logService.log("Initializing MonitoringService with new configuration.");
      const service = new MonitoringService(config, alertConfig);
      setMonitoringService(service);
    } else {
      logService.warn("MonitoringService not initialized. Missing required configuration.");
      setMonitoringService(null);
    }
  }, [config, alertConfig]);

  const validateConfiguration = (): boolean => {
    const check = (value: string, name: string) => {
      if (!value) {
        toast.error(`${name} is required. Please configure it in Settings.`);
        logService.error(`Validation failed: ${name} is missing.`);
        return false;
      }
      return true;
    };
    return check(config.apiKeys.logging, 'Logging API key') &&
           check(config.apiKeys.data, 'Data API key') &&
           check(config.credentials.email, 'Email credential') &&
           check(config.credentials.password, 'Password credential');
  };

  const handleRunTests = async (urls: string[], exclusions: string[]) => {
    if (!validateConfiguration() || !monitoringService) return;

    setIsRunningTests(true);
    toast.loading('Running environment tests...');
    logService.log(`Manual test run initiated for ${urls.length} URLs.`);

    try {
      const results = await monitoringService.runEnvironmentTests(urls, exclusions);
      const convertedResults: EnvironmentResult[] = results.map((result, index) => ({ id: `${index + 1}`, ...result }));
      setEnvironments(convertedResults);
      setLastUpdate(new Date());

      if (alertConfig.enabled) {
        logService.log("Processing alerts for test results.");
        const newAlertState = await monitoringService.processAlerts(results, alertState);
        setAlertState(newAlertState);
      }

      toast.dismiss();
      toast.success(`Environment tests completed - ${results.length} environments tested`);
      logService.log(`Test run completed successfully.`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to run environment tests');
      logService.error('Environment test run failed.', error);
    } finally {
      setIsRunningTests(false);
    }
  };
  
  // Other handlers (handleStartMonitoring, etc.) remain the same
  const handleStartMonitoring = () => { /* ... */ };
  const handleStopMonitoring = () => { /* ... */ };
  const handleRunFullMonitoring = async () => { /* ... */ };
  const handleManualRun = async () => { /* ... */ };
  const handleRunFrequentMode = async () => { /* ... */ };
  const handleRunDailyMode = async () => { /* ... */ };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Toaster position="top-right" />
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="flex-1 ml-64">
            <Header 
              isMonitoring={isMonitoring} lastUpdate={lastUpdate}
              onStartMonitoring={handleStartMonitoring} onStopMonitoring={handleStopMonitoring}
              onManualRun={handleManualRun} onRunFrequentMode={handleRunFrequentMode} onRunDailyMode={handleRunDailyMode}
            />
            
            <main className="p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard environments={environments} clusterMetrics={clusterMetrics} errorDistributions={errorDistributions} isMonitoring={isMonitoring} alertState={alertState} />} />
                <Route path="/reports" element={<Reports environments={environments} clusterMetrics={clusterMetrics} errorDistributions={errorDistributions} />} />
                <Route path="/scheduler" element={<Scheduler config={config} setConfig={setConfig} alertConfig={alertConfig} setAlertConfig={setAlertConfig} />} />
                <Route path="/alerting" element={<AlertingConfig alertConfig={alertConfig} setAlertConfig={setAlertConfig} alertState={alertState} setAlertState={setAlertState} />} />
                <Route path="/files" element={<FileManager fileConfig={fileConfig} setFileConfig={setFileConfig} />} />
                <Route path="/testing" element={<EnvironmentTester config={config} setConfig={setConfig} onRunTests={handleRunTests} isRunning={isRunningTests} />} />
                <Route path="/logs" element={<LiveLogs />} /> {/* Add new route */}
                <Route path="/settings" element={<Settings config={config} setConfig={setConfig} />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;