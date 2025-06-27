import { SlackService } from './slackService';
import { EmailService } from './emailService';
import { GroundcoverService } from './groundcoverService';
import { AlertConfig, AlertState, EnvironmentResult } from '../types';
import { logService } from './logService';

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
    logService.log(`Processing results for ${environments.length} environments.`);

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

      // Log environment check to Groundcover - This is already done in environmentService.
      // This ensures even checks that don't result in alerts are logged.

      if (isFailing) {
        if (!currentState || currentState.status === 'SUCCESS') {
          const reason = this.getFailureReason(env);
          logService.warn(`New failure detected for ${testKey}. Reason: ${reason}`);
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
          const hoursSinceLastReminder = this.getHoursDifference(currentState.lastReminderTimestamp || currentState.firstFailureTimestamp || now, now);
          if (hoursSinceLastReminder >= this.alertConfig.thresholds.reminderInterval) {
            logService.log(`Sending reminder for ongoing failure for ${testKey}.`);
            newAlertState[testKey] = { ...currentState, lastReminderTimestamp: now };
            await this.sendAlert(env.namespace, env.cluster, currentState.reason || 'Unknown', 'reminder');
          }
        }
      } else {
        if (currentState && currentState.status === 'FAIL') {
          logService.log(`Environment ${testKey} has recovered.`);
          await this.sendAlert(env.namespace, env.cluster, 'Environment recovered', 'resolved');
          delete newAlertState[testKey];
        }
      }
    }

    return newAlertState;
  }

  private getFailureReason(env: EnvironmentResult): string {
    const reasons = [];
    if (env.loginPage !== 'Live') reasons.push(`Login page: ${env.loginPage}`);
    if (env.authorization !== 'Success') reasons.push(`Authorization: ${env.authorization}`);
    if (env.message !== 'Success') reasons.push(`Message: ${env.message}`);
    if (env.queryTimeS > this.alertConfig.thresholds.queryResponseTime) reasons.push(`Query timeout: ${env.queryTimeS}s > ${this.alertConfig.thresholds.queryResponseTime}s`);
    return reasons.join(', ') || 'Unknown failure';
  }

  private getHoursDifference = (from: string, to: string) => (new Date(to).getTime() - new Date(from).getTime()) / 36e5;

  private async sendAlert(environment: string, cluster: string, reason: string, type: 'new' | 'reminder' | 'resolved'): Promise<void> {
    if (!this.alertConfig.enabled) {
      logService.warn('Alerting is disabled, skipping alert send.');
      return;
    }

    if (this.groundcoverService) {
      await this.groundcoverService.sendLog({
        timestamp: new Date().toISOString(),
        content: `Alert ${type}: ${environment} - ${reason}`,
        string_attributes: {
          gc_source_type: 'sre_alert',
          alert_type: type,
          environment,
          cluster: `${cluster}-gigaspaces-net`,
          reason,
        }
      });
    }

    if (this.slackService) {
      try {
        await this.slackService.sendAlert(this.alertConfig.channels.slack.alertChannelId, environment, cluster, reason, type);
      } catch (error) {
        logService.error('Failed to send Slack alert:', error);
      }
    }

    if (this.emailService) {
      try {
        await this.emailService.sendAlert(this.alertConfig.channels.email.recipients, environment, cluster, reason, type);
      } catch (error) {
        logService.error('Failed to send email alert:', error);
      }
    }
  }

  async sendDailyReport(reportData: any): Promise<void> {
    if (!this.alertConfig.enabled) return;

    if (this.groundcoverService) {
      await this.groundcoverService.sendLog({
        timestamp: new Date().toISOString(),
        content: 'Daily report generated',
        string_attributes: { gc_source_type: 'daily_report' },
        float_attributes: { environment_count: reportData.environments.length, cluster_count: reportData.clusterMetrics.length }
      });
    }

    if (this.slackService) await this.slackService.sendDailyReport(this.alertConfig.channels.slack.reportChannelId, reportData);
    if (this.emailService) await this.emailService.sendDailyReport(this.alertConfig.channels.email.recipients, reportData);
  }

  async testConnections(): Promise<{ slack: boolean; email: boolean; groundcover: boolean }> {
    const results = { slack: false, email: false, groundcover: false };
    if (this.slackService) results.slack = await this.slackService.testConnection();
    if (this.emailService) results.email = await this.emailService.testConnection();
    if (this.groundcoverService) results.groundcover = await this.groundcoverService.testConnection();
    return results;
  }
}