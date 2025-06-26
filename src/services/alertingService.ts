import { SlackService } from './slackService';
import { EmailService } from './emailService';
import { GroundcoverService } from './groundcoverService';
import { AlertConfig, AlertState, EnvironmentResult } from '../types';

export class AlertingService {
  private slackService?: SlackService;
  private emailService?: EmailService;
  private groundcoverService?: GroundcoverService;
  private alertConfig: AlertConfig;

  constructor(alertConfig: AlertConfig, groundcoverApiKey?: string, groundcoverEndpoint?: string) {
    this.alertConfig = alertConfig;

    if (alertConfig.channels.slack.enabled && alertConfig.channels.slack.botToken) {
      this.slackService = new SlackService(alertConfig.channels.slack.botToken);
    }

    if (alertConfig.channels.email.enabled && alertConfig.channels.email.senderEmail && alertConfig.channels.email.appPassword) {
      this.emailService = new EmailService(
        alertConfig.channels.email.senderEmail,
        alertConfig.channels.email.appPassword
      );
    }

    if (groundcoverApiKey && groundcoverEndpoint) {
      this.groundcoverService = new GroundcoverService(groundcoverApiKey, groundcoverEndpoint);
    }
  }

  async processEnvironmentResults(
    environments: EnvironmentResult[],
    currentAlertState: AlertState
  ): Promise<AlertState> {
    const newAlertState = { ...currentAlertState };

    for (const env of environments) {
      const testKey = `${env.namespace}-${env.cluster}`;
      const isExcluded = this.alertConfig.testExclusions.environments.includes(env.url);
      
      if (isExcluded) {
        continue;
      }

      const isFailing = env.loginPage !== 'Live' || 
                       env.authorization !== 'Success' || 
                       env.message !== 'Success' ||
                       env.queryTimeS > this.alertConfig.thresholds.queryResponseTime;

      const currentState = newAlertState[testKey];
      const now = new Date().toISOString();

      // Log environment check to Groundcover
      if (this.groundcoverService) {
        await this.groundcoverService.logEnvironmentCheck(
          env.namespace,
          env.cluster,
          isFailing ? 'failure' : 'success',
          env
        );
      }

      if (isFailing) {
        if (!currentState || currentState.status === 'SUCCESS') {
          // New failure - send immediate alert
          const reason = this.getFailureReason(env);
          
          newAlertState[testKey] = {
            status: 'FAIL',
            firstFailureTimestamp: now,
            lastReminderTimestamp: now,
            namespace: env.namespace,
            cluster: env.cluster,
            reason,
          };

          await this.sendAlert(env.namespace, env.cluster, reason, 'new');
        } else {
          // Existing failure - check if reminder needed
          const hoursSinceLastReminder = this.getHoursDifference(
            currentState.lastReminderTimestamp || currentState.firstFailureTimestamp || now,
            now
          );

          if (hoursSinceLastReminder >= this.alertConfig.thresholds.reminderInterval) {
            newAlertState[testKey] = {
              ...currentState,
              lastReminderTimestamp: now,
            };

            await this.sendAlert(env.namespace, env.cluster, currentState.reason || 'Unknown', 'reminder');
          }
        }
      } else {
        if (currentState && currentState.status === 'FAIL') {
          // Recovery - send resolution alert
          await this.sendAlert(env.namespace, env.cluster, 'Environment recovered', 'resolved');
          delete newAlertState[testKey];
        }
      }
    }

    return newAlertState;
  }

  private getFailureReason(env: EnvironmentResult): string {
    const reasons = [];
    
    if (env.loginPage !== 'Live') {
      reasons.push(`Login page: ${env.loginPage}`);
    }
    if (env.authorization !== 'Success') {
      reasons.push(`Authorization: ${env.authorization}`);
    }
    if (env.message !== 'Success') {
      reasons.push(`Message: ${env.message}`);
    }
    if (env.queryTimeS > this.alertConfig.thresholds.queryResponseTime) {
      reasons.push(`Query timeout: ${env.queryTimeS}s > ${this.alertConfig.thresholds.queryResponseTime}s`);
    }

    return reasons.join(', ') || 'Unknown failure';
  }

  private getHoursDifference(from: string, to: string): number {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
  }

  private async sendAlert(environment: string, cluster: string, reason: string, type: 'new' | 'reminder' | 'resolved'): Promise<void> {
    if (!this.alertConfig.enabled) {
      return;
    }

    // Log alert to Groundcover
    if (this.groundcoverService) {
      await this.groundcoverService.logAlert(environment, cluster, reason, type);
    }

    // Send Slack alert
    if (this.slackService && this.alertConfig.channels.slack.enabled) {
      try {
        if (type === 'resolved') {
          await this.slackService.sendMessage({
            channel: this.alertConfig.channels.slack.alertChannelId,
            text: `✅ Resolved: ${environment}`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `✅ *Environment Recovered*\n*Environment:* ${environment}\n*Cluster:* ${cluster}\n*Time:* ${new Date().toLocaleString()}`
                }
              }
            ]
          });
        } else {
          await this.slackService.sendAlert(
            this.alertConfig.channels.slack.alertChannelId,
            environment,
            cluster,
            `${type === 'reminder' ? '[REMINDER] ' : ''}${reason}`
          );
        }
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }

    // Send email alert
    if (this.emailService && this.alertConfig.channels.email.enabled) {
      try {
        if (type === 'resolved') {
          await this.emailService.sendEmail({
            to: this.alertConfig.channels.email.recipients,
            subject: `✅ Resolved: ${environment}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #059669; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0;">✅ Environment Recovered</h1>
                </div>
                <div style="padding: 20px;">
                  <p><strong>Environment:</strong> ${environment}</p>
                  <p><strong>Cluster:</strong> ${cluster}</p>
                  <p><strong>Recovery Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
              </div>
            `
          });
        } else {
          await this.emailService.sendAlert(
            this.alertConfig.channels.email.recipients,
            environment,
            cluster,
            `${type === 'reminder' ? '[REMINDER] ' : ''}${reason}`
          );
        }
      } catch (error) {
        console.error('Failed to send email alert:', error);
      }
    }
  }

  async sendDailyReport(reportData: any): Promise<void> {
    if (!this.alertConfig.enabled) {
      return;
    }

    // Log report generation to Groundcover
    if (this.groundcoverService) {
      await this.groundcoverService.logSystemEvent('daily_report_generated', {
        environmentCount: reportData.environments.length,
        clusterCount: reportData.clusterMetrics.length,
        errorRecordCount: reportData.errorDistributions.length,
      });
    }

    // Send Slack report
    if (this.slackService && this.alertConfig.channels.slack.enabled) {
      try {
        await this.slackService.sendDailyReport(
          this.alertConfig.channels.slack.reportChannelId,
          reportData
        );
      } catch (error) {
        console.error('Failed to send Slack daily report:', error);
      }
    }

    // Send email report
    if (this.emailService && this.alertConfig.channels.email.enabled) {
      try {
        await this.emailService.sendDailyReport(
          this.alertConfig.channels.email.recipients,
          reportData
        );
      } catch (error) {
        console.error('Failed to send email daily report:', error);
      }
    }
  }

  async testConnections(): Promise<{ slack: boolean; email: boolean; groundcover: boolean }> {
    const results = {
      slack: false,
      email: false,
      groundcover: false,
    };

    if (this.slackService) {
      results.slack = await this.slackService.testConnection();
    }

    if (this.emailService) {
      results.email = await this.emailService.testConnection();
    }

    if (this.groundcoverService) {
      results.groundcover = await this.groundcoverService.testConnection();
    }

    return results;
  }
}