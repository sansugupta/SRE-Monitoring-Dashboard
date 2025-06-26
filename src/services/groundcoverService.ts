export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  environment?: string;
  cluster?: string;
  metadata?: Record<string, any>;
}

export class GroundcoverService {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async sendLog(logEntry: LogEntry): Promise<boolean> {
    if (!this.apiKey || !this.endpoint) {
      console.error('Groundcover credentials not configured');
      return false;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...logEntry,
          source: 'sre-monitoring-dashboard',
          timestamp: logEntry.timestamp || new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error('Groundcover API error:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send log to Groundcover:', error);
      return false;
    }
  }

  async logEnvironmentCheck(environment: string, cluster: string, status: 'success' | 'failure', details: any): Promise<boolean> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: status === 'success' ? 'info' : 'error',
      message: `Environment check ${status}: ${environment}`,
      environment,
      cluster,
      metadata: {
        type: 'environment_check',
        status,
        queryTime: details.queryTimeS,
        loginPage: details.loginPage,
        authorization: details.authorization,
        message: details.message,
        version: details.version,
        lastTransactionDate: details.lastTransactionDate,
      }
    };

    return this.sendLog(logEntry);
  }

  async logAlert(environment: string, cluster: string, reason: string, alertType: 'new' | 'reminder' | 'resolved'): Promise<boolean> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: alertType === 'resolved' ? 'info' : 'warn',
      message: `Alert ${alertType}: ${environment} - ${reason}`,
      environment,
      cluster,
      metadata: {
        type: 'alert',
        alertType,
        reason,
      }
    };

    return this.sendLog(logEntry);
  }

  async logSystemEvent(event: string, details: Record<string, any>): Promise<boolean> {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `System event: ${event}`,
      metadata: {
        type: 'system_event',
        event,
        ...details,
      }
    };

    return this.sendLog(logEntry);
  }

  async testConnection(): Promise<boolean> {
    const testLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Groundcover connection test',
      metadata: {
        type: 'connection_test',
      }
    };

    return this.sendLog(testLog);
  }
}