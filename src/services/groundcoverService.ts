import { logService } from './logService';

export interface GroundcoverPayload {
  timestamp: string;
  content: string;
  string_attributes: Record<string, any>;
  float_attributes?: Record<string, any>;
}

export class GroundcoverService {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async sendLog(payload: GroundcoverPayload): Promise<boolean> {
    if (!this.apiKey || !this.endpoint) {
      logService.error('Groundcover credentials not configured');
      return false;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logService.error(`Groundcover API error: ${response.status} - ${response.statusText}`, errorText);
        return false;
      }
      
      logService.log(`Log successfully sent to Groundcover: ${payload.content}`);
      return true;
    } catch (error) {
      logService.error('Failed to send log to Groundcover', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    const testPayload: GroundcoverPayload = {
      timestamp: new Date().toISOString(),
      content: 'Groundcover connection test from SRE Dashboard',
      string_attributes: {
        gc_source_type: 'connection_test'
      }
    };
    return this.sendLog(testPayload);
  }
}