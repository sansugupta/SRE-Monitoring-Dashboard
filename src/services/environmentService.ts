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
    private groundcoverService?: any
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

    // Check if environment is excluded
    if (exclusions.includes(url)) {
      result.loginPage = 'Disabled';
      result.authorization = 'Disabled';
      result.message = 'Disabled';
      result.lastTransactionDate = 'Environment excluded from testing';
      return result;
    }

    try {
      // Get application ID for this environment
      const applicationId = this.getApplicationId(url);
      if (!applicationId) {
        throw new Error('No application ID configured for this environment');
      }

      // Step 1: Login and get cookies
      const { cookies, error } = await this.loginToEnvironment(url, applicationId);
      if (!cookies) {
        throw new Error(error || 'Login failed');
      }

      // Step 2: Check login page availability
      const { status: loginStatus, duration: loginDuration } = await this.checkLoginPageAvailability(url, cookies, namespace, cluster);
      result.loginPage = loginStatus;

      if (loginStatus !== 'Live') {
        await this.logToGroundcover('login_page', url, loginStatus, namespace, cluster, loginDuration);
        return result;
      }

      // Step 3: Get authorization token
      const { token, status: authStatus, duration: authDuration } = await this.getAuthToken(url, cookies, namespace, cluster);
      result.authorization = authStatus;

      if (authStatus !== 'Success' || !token) {
        await this.logToGroundcover('authorization', url, authStatus, namespace, cluster, authDuration);
        return result;
      }

      // Step 4: Get version
      result.version = await this.getEnvironmentVersion(url, cookies);

      // Step 5: Query the environment
      const { status: queryStatus, queryTime, nlResult } = await this.queryEnvironment(url, token, cookies, namespace, cluster);
      result.message = queryStatus;
      result.queryTimeS = queryTime;
      result.lastTransactionDate = nlResult;

      await this.logToGroundcover('message', url, queryStatus, namespace, cluster, queryTime * 1000);

    } catch (error) {
      console.error(`Error testing environment ${url}:`, error);
      result.lastTransactionDate = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Log the error to Groundcover
      await this.logToGroundcover('error', url, 'Fail', namespace, cluster, 0, error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private extractNamespace(url: string): string {
    try {
      return url.split('.')[0].replace('https://', '');
    } catch {
      return 'unknown_env';
    }
  }

  private extractCluster(url: string): string {
    try {
      return url.split('.')[1];
    } catch {
      return 'unknown_cluster';
    }
  }

  private getRegion(cluster: string): string {
    if (cluster.includes('erag-c1')) return 'US';
    if (cluster.includes('euc1')) return 'EU';
    if (cluster.includes('use1')) return 'US-EAST';
    if (cluster.includes('erag-dev')) return 'DEV';
    if (cluster.includes('mercury')) return 'MERCURY';
    return 'N/A';
  }

  private getApplicationId(url: string): string | null {
    const envSpecific = this.config.applicationIds.environmentSpecific[url];
    return envSpecific || this.config.applicationIds.default || null;
  }

  private async loginToEnvironment(url: string, applicationId: string): Promise<{ cookies?: Record<string, string>; error?: string }> {
    const payload = {
      email: this.credentials.email,
      password: this.credentials.password,
      invitationToken: ""
    };

    for (const template of this.LOGIN_URL_TEMPLATES) {
      const loginUrl = template.replace('{url}', url);
      
      try {
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'frontegg-requested-application-id': applicationId,
            'frontegg-source': 'login-box',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.TIMEOUT)
        });

        if (response.ok) {
          // Extract cookies from response headers
          const cookies: Record<string, string> = {};
          const setCookieHeaders = response.headers.get('set-cookie');
          if (setCookieHeaders) {
            setCookieHeaders.split(',').forEach(cookie => {
              const [nameValue] = cookie.split(';');
              const [name, value] = nameValue.split('=');
              if (name && value) {
                cookies[name.trim()] = value.trim();
              }
            });
          }
          return { cookies };
        }

        if (response.status === 404) {
          continue; // Try next template
        }

        return { error: `HTTP ${response.status}: ${await response.text()}` };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { error: 'Login timeout' };
        }
        continue; // Try next template
      }
    }

    return { error: 'All login attempts failed' };
  }

  private async checkLoginPageAvailability(url: string, cookies: Record<string, string>, namespace: string, cluster: string): Promise<{ status: 'Live' | 'Not Live'; duration: number }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: this.buildCookieHeader(cookies),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      const duration = Date.now() - startTime;
      const status = response.ok ? 'Live' : 'Not Live';
      
      return { status, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { status: 'Not Live', duration };
    }
  }

  private async getAuthToken(url: string, cookies: Record<string, string>, namespace: string, cluster: string): Promise<{ token?: string; status: 'Success' | 'Fail'; duration: number }> {
    const startTime = Date.now();
    const tokenUrl = `${url}/api/get-token`;

    try {
      const response = await fetch(tokenUrl, {
        headers: this.buildCookieHeader(cookies),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        return { status: 'Fail', duration };
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        return { status: 'Fail', duration };
      }

      return { token, status: 'Success', duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { status: 'Fail', duration };
    }
  }

  private async getEnvironmentVersion(url: string, cookies: Record<string, string>): Promise<string> {
    try {
      const response = await fetch(`${url}/api/version`, {
        headers: this.buildCookieHeader(cookies),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (response.ok) {
        const data = await response.json();
        return data.version || 'Unknown';
      }
    } catch (error) {
      console.error(`Failed to get version for ${url}:`, error);
    }
    return 'Unknown';
  }

  private async queryEnvironment(url: string, token: string, cookies: Record<string, string>, namespace: string, cluster: string): Promise<{ status: 'Success' | 'Fail'; queryTime: number; nlResult: string }> {
    const startTime = Date.now();
    const queryUrl = `${url}${this.NEW_API_ENDPOINT}`;

    const payload = {
      query: this.DEFAULT_QUESTION,
      queryEn: "",
      queriesHistorical: [],
      evidence: "",
      model: "azure-openai-gpt4o-2024-08-06",
      applicationId: 1,
      skipCacheSearch: true,
      skipSchemaFiltering: true
    };

    try {
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'User-id': this.USER_ID,
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'correlation-id': this.generateCorrelationId(),
          ...this.buildCookieHeader(cookies)
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      const duration = Date.now() - startTime;
      const queryTime = Math.round(duration / 1000);

      if (!response.ok) {
        return {
          status: 'Fail',
          queryTime,
          nlResult: `HTTP Error: ${response.status}`
        };
      }

      // Check if response time exceeded threshold
      if (queryTime > this.QUERY_RESPONSE_THRESHOLD_S) {
        return {
          status: 'Fail',
          queryTime,
          nlResult: `Response time exceeded threshold (${this.QUERY_RESPONSE_THRESHOLD_S}s)`
        };
      }

      const data = await response.json();
      const nlResult = data.nl_result || 'No answer found';

      // Check for failure patterns in the response
      const failurePatterns = [
        "sorry, i didn't get that. please, try again.",
        "this request can't be processed because the limit for connected data was exceeded. please contact your administrator."
      ];

      const isFailure = failurePatterns.some(pattern => 
        nlResult.toLowerCase().includes(pattern)
      );

      return {
        status: isFailure ? 'Fail' : 'Success',
        queryTime,
        nlResult
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const queryTime = Math.round(duration / 1000);

      return {
        status: 'Fail',
        queryTime,
        nlResult: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildCookieHeader(cookies: Record<string, string>): Record<string, string> {
    const cookieString = Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    return cookieString ? { 'Cookie': cookieString } : {};
  }

  private generateCorrelationId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async logToGroundcover(testType: string, url: string, status: string, namespace: string, cluster: string, duration: number, error?: string): Promise<void> {
    if (!this.groundcoverService) return;

    const logData = {
      timestamp: new Date().toISOString(),
      content: `${testType} test for ${url}: ${status}${error ? ` - ${error}` : ''}`,
      string_attributes: {
        test_type: testType,
        url,
        status,
        cluster: `${cluster}-gigaspaces-net`,
        namespace,
        gc_source_type: 'observability_report',
        'k8s.pod.annotation.monitorLevel': 'critical'
      },
      float_attributes: {
        duration_ms: duration
      }
    };

    await this.groundcoverService.sendLog(logData);
  }
}