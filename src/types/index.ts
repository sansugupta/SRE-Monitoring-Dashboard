export interface EnvironmentResult {
  id: string;
  namespace: string;
  cluster: string;
  region: string;
  url: string;
  loginPage: 'Live' | 'Not Live' | 'Disabled';
  authorization: 'Success' | 'Fail' | 'Disabled';
  message: 'Success' | 'Fail' | 'Disabled';
  queryTimeS: number;
  version: string;
  lastChecked: Date;
  lastTransactionDate?: string;
}

export interface ClusterMetrics {
  cluster: string;
  region: string;
  nodes: number;
  ramUsage: number;
  cpuUsage: number;
  lastUpdated: Date;
}

export interface ErrorDistribution {
  namespace: string;
  cluster: string;
  region: string;
  errors24h: number;
  errorRate24h: number;
  errors48h: number;
  errorRate48h: number;
  errors72h: number;
  errorRate72h: number;
}

export interface AppConfig {
  apiKeys: {
    logging: string;
    data: string;
  };
  endpoints: {
    groundcoverLogging: string;
    victoriaMetrics: string;
    clickhouse: string;
  };
  environmentUrls: string[];
  errorDistUrls: string[];
  credentials: {
    email: string;
    password: string;
  };
  applicationIds: {
    default: string;
    environmentSpecific: Record<string, string>;
  };
}

export interface AlertConfig {
  enabled: boolean;
  channels: {
    slack: {
      enabled: boolean;
      botToken: string;
      alertChannelId: string;
      reportChannelId: string;
    };
    email: {
      enabled: boolean;
      senderEmail: string;
      appPassword: string;
      recipients: string[];
    };
  };
  thresholds: {
    queryResponseTime: number;
    reminderInterval: number;
  };
  testExclusions: {
    environments: string[];
  };
}

export interface FileConfig {
  baseDirectory: string;
  files: {
    envList: string;
    errorDistEnvs: string;
    logo: string;
    checkIcon: string;
    timesIcon: string;
    exclamationIcon: string;
  };
}

export interface ScheduleConfig {
  monitoringInterval: number;
  reportGeneration: {
    enabled: boolean;
    time: string;
    timezone: string;
  };
  emailNotifications: {
    enabled: boolean;
    dailyReport: boolean;
    alerts: boolean;
  };
  slackNotifications: {
    enabled: boolean;
    dailyReport: boolean;
    alerts: boolean;
  };
}

export interface AlertState {
  [testKey: string]: {
    status: 'FAIL' | 'SUCCESS';
    firstFailureTimestamp?: string;
    lastReminderTimestamp?: string;
    namespace: string;
    cluster: string;
    reason?: string;
  };
}