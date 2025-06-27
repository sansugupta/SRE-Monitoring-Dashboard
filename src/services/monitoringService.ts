import { EnvironmentService, EnvironmentTestResult } from './environmentService';
import { MetricsService, ClusterMetric, ErrorDistributionData } from './metricsService';
import { GroundcoverService } from './groundcoverService';
import { AlertingService } from './alertingService';
import { AppConfig, AlertConfig, AlertState } from '../types';
import { logService } from './logService';

export interface MonitoringResults {
  environments: EnvironmentTestResult[];
  clusterMetrics: ClusterMetric[];
  errorDistributions: ErrorDistributionData[];
}

export class MonitoringService {
  private environmentService: EnvironmentService;
  private metricsService: MetricsService;
  private groundcoverService: GroundcoverService;
  private alertingService?: AlertingService;

  constructor(
    private config: AppConfig,
    private alertConfig?: AlertConfig
  ) {
    this.groundcoverService = new GroundcoverService(
      config.apiKeys.logging,
      config.endpoints.groundcoverLogging
    );

    this.environmentService = new EnvironmentService(
      config.credentials,
      {
        applicationIds: config.applicationIds
      },
      this.groundcoverService
    );

    this.metricsService = new MetricsService(config.apiKeys.data);

    if (alertConfig) {
      this.alertingService = new AlertingService(
        alertConfig,
        config.apiKeys.logging,
        config.endpoints.groundcoverLogging
      );
    }
  }

  async runEnvironmentTests(
    urls: string[] = [],
    exclusions: string[] = []
  ): Promise<EnvironmentTestResult[]> {
    const urlsToTest = urls.length > 0 ? urls : this.config.environmentUrls;
    
    if (urlsToTest.length === 0) {
      logService.warn('No environment URLs configured for testing');
      return [];
    }

    logService.log(`Starting tests for ${urlsToTest.length} environments...`);
    
    const results: EnvironmentTestResult[] = [];
    const concurrency = 5;
    for (let i = 0; i < urlsToTest.length; i += concurrency) {
      const batch = urlsToTest.slice(i, i + concurrency);
      const batchPromises = batch.map(url => 
        this.environmentService.testEnvironment(url, exclusions)
          .catch(error => {
            logService.error(`Failed to test environment ${url}`, error);
            return this.createFailedResult(url, error);
          })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    await this.logTestSummary(results);
    logService.log(`Environment tests completed. See summary log for details.`);
    return results;
  }

  async runFullMonitoring(exclusions: string[] = []): Promise<MonitoringResults> {
    logService.log('Starting full monitoring run...');
    const environments = await this.runEnvironmentTests([], exclusions);

    const clusters = await this.metricsService.detectClusters();
    logService.log(`Detected clusters: ${clusters.join(', ')}`);

    const [clusterMetrics, errorDistributions] = await Promise.all([
      this.metricsService.fetchClusterMetrics(clusters),
      this.metricsService.fetchErrorDistribution(
        clusters,
        environments.map(env => env.namespace)
      )
    ]);

    if (this.alertingService) {
      try {
        await this.alertingService.processEnvironmentResults(environments, {});
      } catch (error) {
        logService.error('Error processing alerts during full monitoring', error);
      }
    }

    const results = { environments, clusterMetrics, errorDistributions };
    logService.log(`Full monitoring completed: ${environments.length} envs, ${clusterMetrics.length} clusters, ${errorDistributions.length} error records.`);
    return results;
  }

  async processAlerts(
    environments: EnvironmentTestResult[],
    currentAlertState: AlertState
  ): Promise<AlertState> {
    if (!this.alertingService) {
      logService.warn('Alerting service not configured, skipping alert processing.');
      return currentAlertState;
    }

    try {
      return await this.alertingService.processEnvironmentResults(environments, currentAlertState);
    } catch (error) {
      logService.error('Error processing alerts:', error);
      return currentAlertState;
    }
  }

  private createFailedResult(url: string, error: any): EnvironmentTestResult {
    const namespace = url.split('.')[0]?.replace('https://', '') || 'unknown';
    const cluster = url.split('.')[1] || 'unknown';
    
    return {
      namespace, cluster, region: 'N/A', url,
      loginPage: 'Not Live', authorization: 'Fail', message: 'Fail',
      queryTimeS: 0, version: 'Unknown',
      lastTransactionDate: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date()
    };
  }

  private async logTestSummary(results: EnvironmentTestResult[]): Promise<void> {
    const summary = {
      total: results.length,
      live: results.filter(r => r.loginPage === 'Live').length,
      authorized: results.filter(r => r.authorization === 'Success').length,
      successful_queries: results.filter(r => r.message === 'Success').length,
      disabled: results.filter(r => r.loginPage === 'Disabled').length
    };

    if (this.groundcoverService) {
      await this.groundcoverService.sendLog({
        timestamp: new Date().toISOString(),
        content: 'Environment test summary',
        string_attributes: { gc_source_type: 'test_summary' },
        float_attributes: summary,
      });
    }
  }
}