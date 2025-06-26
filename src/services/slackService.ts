export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
}

export class SlackService {
  private botToken: string;
  private baseUrl = 'https://slack.com/api';

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.botToken) {
      console.error('Slack bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('Slack API error:', result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      return false;
    }
  }

  async sendAlert(channelId: string, environment: string, cluster: string, reason: string): Promise<boolean> {
    const message: SlackMessage = {
      channel: channelId,
      text: `🚨 Production Alert: ${environment}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Production Environment Alert'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${environment}`
            },
            {
              type: 'mrkdwn',
              text: `*Cluster:*\n${cluster}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n❌ FAILED`
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date().toLocaleString()}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Reason:* ${reason}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🔍 Please investigate immediately'
            }
          ]
        }
      ]
    };

    return this.sendMessage(message);
  }

  async sendDailyReport(channelId: string, reportData: any): Promise<boolean> {
    const { environments, clusterMetrics, errorDistributions } = reportData;
    const successfulEnvs = environments.filter((env: any) => env.loginPage === 'Live').length;
    const totalEnvs = environments.length;
    const totalNodes = clusterMetrics.reduce((sum: number, cluster: any) => sum + cluster.nodes, 0);
    const highestErrorRate = Math.max(...errorDistributions.map((err: any) => err.errorRate24h), 0);

    const message: SlackMessage = {
      channel: channelId,
      text: `📊 Daily Production Report - ${new Date().toLocaleDateString()}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📊 Daily Production Report - ${new Date().toLocaleDateString()}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Environment Health:*\n${successfulEnvs}/${totalEnvs} Live`
            },
            {
              type: 'mrkdwn',
              text: `*Total Nodes:*\n${totalNodes}`
            },
            {
              type: 'mrkdwn',
              text: `*Highest Error Rate:*\n${highestErrorRate.toFixed(1)}%`
            },
            {
              type: 'mrkdwn',
              text: `*Report Time:*\n${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    };

    return this.sendMessage(message);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return false;
    }
  }
}