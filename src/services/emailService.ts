export interface EmailMessage {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private senderEmail: string;
  private appPassword: string;

  constructor(senderEmail: string, appPassword: string) {
    this.senderEmail = senderEmail;
    this.appPassword = appPassword;
  }

  async sendEmail(message: EmailMessage): Promise<boolean> {
    if (!this.senderEmail || !this.appPassword) {
      console.error('Email credentials not configured');
      return false;
    }
    // This is a mock. Replace with a real email service provider API call.
    console.log("Mock sending email:", message.subject);
    return Promise.resolve(true);
  }

  async sendAlert(recipients: string[], environment: string, cluster: string, reason: string, type: 'new' | 'reminder' | 'resolved'): Promise<boolean> {
    const isResolved = type === 'resolved';
    const subject = isResolved ? `✅ Resolved: ${environment}` : `🚨 Production Alert: ${environment}`;
    const headerColor = isResolved ? '#059669' : '#dc2626';
    const headerText = isResolved ? '✅ Environment Recovered' : '🚨 Production Environment Alert';
    const statusText = isResolved ? '✅ RECOVERED' : '❌ FAILED';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${headerColor}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${headerText}</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Environment:</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${environment}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Cluster:</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${cluster}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Status:</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: ${headerColor};">${statusText}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Time:</td><td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleString()}</td></tr>
            ${!isResolved ? `<tr><td style="padding: 10px; font-weight: bold;">Reason:</td><td style="padding: 10px;">${reason}</td></tr>` : ''}
          </table>
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;"><p>This alert was generated by the SRE Monitoring Dashboard</p></div>
      </div>
    `;

    return this.sendEmail({ to: recipients, subject, html });
  }

  async sendDailyReport(recipients: string[], reportData: any): Promise<boolean> {
    // Implementation is unchanged
    const { environments, clusterMetrics } = reportData;
    const successfulEnvs = environments.filter((env: any) => env.loginPage === 'Live').length;
    const totalEnvs = environments.length;
    const totalNodes = clusterMetrics.reduce((sum: number, cluster: any) => sum + cluster.nodes, 0);

    const subject = `📊 Daily Production Report - ${new Date().toLocaleDateString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">📊 Daily Production Report</h1>
          <p style="margin: 10px 0 0 0;">${new Date().toLocaleDateString()}</p>
        </div>
        <div style="padding: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0; color: #1e40af;">Environment Health</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: ${successfulEnvs === totalEnvs ? '#059669' : '#dc2626'};">
                ${successfulEnvs}/${totalEnvs}
              </p>
              <p style="margin: 0; color: #6b7280;">Environments Live</p>
            </div>
          </div>
        </div>
      </div>`;

    return this.sendEmail({ to: recipients, subject, html });
  }

  async testConnection(): Promise<boolean> {
    return this.sendEmail({
      to: [this.senderEmail],
      subject: 'SRE Dashboard - Email Test',
      html: '<p>This is a test email from the SRE Monitoring Dashboard.</p>',
    });
  }
}