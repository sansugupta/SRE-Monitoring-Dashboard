import { logService } from './logService';
import { GroundcoverService } from './groundcoverService';

export interface EnvironmentTestResult {
  namespace: string;
  cluster: string;
  region: string;
  url: string;
  loginPage: 'Live' | 'Not Live' | 'Disabled';
  authorization: 'Success' | 'Fail' | 'Disabled';
  message: 'Success' | 'Fail' | 'Disabled';
  queryTimeS: number;
  version: string;
  lastTransactionDate: string;
  lastChecked: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface EnvironmentConfig {
  applicationIds: {
    default: string;
    environmentSpecific: Record<string, string>;
  };
}

export class EnvironmentService {
  private readonly TIMEOUT = 60000; // 60 seconds
  private readonly DEFAULT_QUESTION = "What is the last transaction date?";
  private readonly NEW_API_ENDPOINT = "/api/erag-backend/v1/toucan-sql/nlp-query";
  private readonly QUERY_RESPONSE_THRESHOLD_S = 60;
  private readonly USER_ID = "48b643e1-c6b7-48fd-b7c8-b1dbe0ad7d90";
  
  private readonly LOGIN_URL_TEMPLATES = [
    "{url}/api/frontegg/identity/resources/auth/v1/user",
    "https://gs-erag.frontegg.com/frontegg/identity/resources/auth/v1/user"
  ];

  constructor(
    private credentials: LoginCredentials,
    private config: EnvironmentConfig,
    private groundcoverService?: GroundcoverService
  ) {}

  async testEnvironment(url: string, exclusions: string[] = []): Promise<EnvironmentTestResult> {
    const namespace = this.extractNamespace(url);
    const cluster = this.extractCluster(url);
    const region = this.getRegion(cluster);

    const result: EnvironmentTestResult = {
      namespace,
      cluster,
      region,
      url,
      loginPage: 'Not Live',
      authorization: 'Fail',
      message: 'Fail',
      queryTimeS: 0,
      version: 'Unknown',
      lastTransactionDate: 'Error retrieving data',
      lastChecked: new Date()
    };

    if (exclusions.includes(url)) {
      result.loginPage = 'Disabled';
      result.authorization = 'Disabled';
      result.message = 'Disabled';
      result.lastTransactionDate = 'Environment excluded from testing';
      logService.warn(`Skipping tests for excluded environment: ${url}`);
      return result;
    }

    try {
      logService.log(`Starting test for environment: ${url}`);
      const applicationId = this.getApplicationId(url);
      if (!applicationId) {
        throw new Error('No application ID configured for this environment');
      }

      const { success, error } = await this.loginToEnvironment(url, applicationId);
      if (!success) {
        throw new Error(error || 'Login failed');
      }
      logService.log(`Login successful for ${url}`);

      const { status: loginStatus, duration: loginDuration } = await this.checkLoginPageAvailability(url, namespace, cluster);
      result.loginPage = loginStatus;
      await this.logToGroundcover('login_page', url, loginStatus, namespace, cluster, loginDuration);
      if (loginStatus !== 'Live') return result;
      logService.log(`Login page check for ${url}: ${loginStatus}`);

      const { token, status: authStatus, duration: authDuration } = await this.getAuthToken(url, namespace, cluster);
      result.authorization = authStatus;
      await this.logToGroundcover('authorization', url, authStatus, namespace, cluster, authDuration);
      if (authStatus !== 'Success' || !token) return result;
      logService.log(`Auth token retrieved for ${url}`);
      
      result.version = await this.getEnvironmentVersion(url);
      logService.log(`Version for ${url}: ${result.version}`);

      const { status: queryStatus, queryTime, nlResult } = await this.queryEnvironment(url, token, namespace, cluster);
      result.message = queryStatus;
      result.queryTimeS = queryTime;
      result.lastTransactionDate = nlResult;
      await this.logToGroundcover('message', url, queryStatus, namespace, cluster, queryTime * 1000);
      logService.log(`Query for ${url} completed with status: ${queryStatus}`);

    } catch (error) {
      logService.error(`Error testing environment ${url}:`, error);
      result.lastTransactionDate = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await this.logToGroundcover('error', url, 'Fail', namespace, cluster, 0, error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private extractNamespace = (url: string) => url.split('.')[0]?.replace('https://', '') || 'unknown_env';
  private extractCluster = (url: string) => url.split('.')[1] || 'unknown_cluster';
  private getRegion = (cluster: string) => cluster.includes('erag-c1') ? 'US' : cluster.includes('euc1') ? 'EU' : cluster.includes('use1') ? 'US-EAST' : cluster.includes('erag-dev') ? 'DEV' : cluster.includes('mercury') ? 'MERCURY' : 'N/A';
  private getApplicationId = (url: string) => this.config.applicationIds.environmentSpecific[url] || this.config.applicationIds.default || null;

  private async loginToEnvironment(url: string, applicationId: string): Promise<{ success: boolean; error?: string }> {
    const payload = { email: this.credentials.email, password: this.credentials.password, invitationToken: "" };

    for (const template of this.LOGIN_URL_TEMPLATES) {
      const loginUrl = template.replace('{url}', url);
      try {
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'frontegg-requested-application-id': applicationId },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.TIMEOUT),
          credentials: 'include' // Let browser handle cookies
        });

        if (response.ok) return { success: true };
        if (response.status === 404) continue;

        const errorText = await response.text();
        return { success: false, error: `Login failed with status ${response.status}: ${errorText}` };
      } catch (error) {
        logService.warn(`Login attempt to ${loginUrl} failed.`, error);
        continue;
      }
    }
    return { success: false, error: 'All login attempts failed' };
  }
  
  private async fetchWithCredentials(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, { ...options, credentials: 'include', signal: AbortSignal.timeout(this.TIMEOUT) });
  }

  private async checkLoginPageAvailability(url: string, namespace: string, cluster: string): Promise<{ status: 'Live' | 'Not Live'; duration: number }> {
    const startTime = Date.now();
    try {
      const response = await this.fetchWithCredentials(url);
      return { status: response.ok ? 'Live' : 'Not Live', duration: Date.now() - startTime };
    } catch (error) {
      return { status: 'Not Live', duration: Date.now() - startTime };
    }
  }

  private async getAuthToken(url: string, namespace: string, cluster: string): Promise<{ token?: string; status: 'Success' | 'Fail'; duration: number }> {
    const startTime = Date.now();
    try {
      const response = await this.fetchWithCredentials(`${url}/api/get-token`);
      const duration = Date.now() - startTime;
      if (!response.ok) return { status: 'Fail', duration };

      const data = await response.json();
      return { token: data.token, status: data.token ? 'Success' : 'Fail', duration };
    } catch (error) {
      return { status: 'Fail', duration: Date.now() - startTime };
    }
  }

  private async getEnvironmentVersion(url: string): Promise<string> {
    try {
      const response = await this.fetchWithCredentials(`${url}/api/version`);
      if (response.ok) {
        const data = await response.json();
        return data.version || 'Unknown';
      }
    } catch (error) {
      logService.warn(`Failed to get version for ${url}:`, error);
    }
    return 'Unknown';
  }

  private async queryEnvironment(url: string, token: string, namespace: string, cluster: string): Promise<{ status: 'Success' | 'Fail'; queryTime: number; nlResult: string }> {
    const startTime = Date.now();
    const payload = {
      query: this.DEFAULT_QUESTION, queryEn: "", queriesHistorical: [], evidence: "",
      model: "azure-openai-gpt4o-2024-08-06", applicationId: 1, skipCacheSearch: true, skipSchemaFiltering: true
    };
    try {
      const response = await this.fetchWithCredentials(`${url}${this.NEW_API_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}`, 'User-id': this.USER_ID, 'Content-Type': 'application/json', 'accept': 'application/json', 'correlation-id': this.generateCorrelationId() },
        body: JSON.stringify(payload),
      });

      const duration = Date.now() - startTime;
      const queryTime = Math.round(duration / 1000);
      
      if (!response.ok) return { status: 'Fail', queryTime, nlResult: `HTTP Error: ${response.status}` };
      if (queryTime > this.QUERY_RESPONSE_THRESHOLD_S) return { status: 'Fail', queryTime, nlResult: `Response time exceeded threshold (${this.QUERY_RESPONSE_THRESHOLD_S}s)` };

      const data = await response.json();
      const nlResult = data.nl_result || 'No answer found';
      const isFailure = ["sorry, i didn't get that. please, try again.", "this request can't be processed because the limit for connected data was exceeded. please contact your administrator."].some(p => nlResult.toLowerCase().includes(p));

      return { status: isFailure ? 'Fail' : 'Success', queryTime, nlResult };
    } catch (error) {
      return { status: 'Fail', queryTime: Math.round((Date.now() - startTime) / 1000), nlResult: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private generateCorrelationId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });

  private async logToGroundcover(testType: string, url: string, status: string, namespace: string, cluster: string, duration: number, error?: string): Promise<void> {
    if (!this.groundcoverService) return;

    await this.groundcoverService.sendLog({
      timestamp: new Date().toISOString(),
      content: `${testType} test for ${url}: ${status}${error ? ` - ${error}` : ''}`,
      string_attributes: { test_type: testType, url, status, cluster: `${cluster}-gigaspaces-net`, namespace, gc_source_type: 'observability_report', 'k8s.pod.annotation.monitorLevel': 'critical' },
      float_attributes: { duration_ms: duration }
    });
  }
}