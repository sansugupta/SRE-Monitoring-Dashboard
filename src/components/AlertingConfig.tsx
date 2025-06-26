import React, { useState } from 'react';
import { Bell, Slack, Mail, AlertTriangle, CheckCircle, Clock, Settings as SettingsIcon } from 'lucide-react';
import { AlertConfig, AlertState } from '../types';
import { AlertingService } from '../services/alertingService';
import toast from 'react-hot-toast';

interface AlertingConfigProps {
  alertConfig: AlertConfig;
  setAlertConfig: (config: AlertConfig) => void;
  alertState: AlertState;
  setAlertState: (state: AlertState) => void;
}

export function AlertingConfig({ alertConfig, setAlertConfig, alertState, setAlertState }: AlertingConfigProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [testingConnections, setTestingConnections] = useState(false);

  const updateAlertConfig = (section: keyof AlertConfig, field: string, value: any) => {
    setAlertConfig({
      ...alertConfig,
      [section]: typeof alertConfig[section] === 'object' ? {
        ...alertConfig[section],
        [field]: value
      } : value
    });
  };

  const updateChannelConfig = (channel: 'slack' | 'email', field: string, value: any) => {
    setAlertConfig({
      ...alertConfig,
      channels: {
        ...alertConfig.channels,
        [channel]: {
          ...alertConfig.channels[channel],
          [field]: value
        }
      }
    });
  };

  const testConnections = async () => {
    if (!alertConfig.channels.slack.botToken && !alertConfig.channels.email.senderEmail) {
      toast.error('Please configure at least one notification channel first');
      return;
    }
    
    setTestingConnections(true);
    toast.loading('Testing connections...');
    
    try {
      const alertingService = new AlertingService(alertConfig);
      const results = await alertingService.testConnections();
      
      toast.dismiss();
      
      if (results.slack && alertConfig.channels.slack.enabled) {
        toast.success('Slack connection successful!');
      } else if (alertConfig.channels.slack.enabled) {
        toast.error('Slack connection failed - check your bot token and permissions');
      }
      
      if (results.email && alertConfig.channels.email.enabled) {
        toast.success('Email connection successful!');
      } else if (alertConfig.channels.email.enabled) {
        toast.error('Email connection failed - check your credentials');
      }
      
      if (results.groundcover) {
        toast.success('Groundcover logging connection successful!');
      } else {
        toast.error('Groundcover logging connection failed - check your API key');
      }
      
    } catch (error) {
      toast.dismiss();
      toast.error('Connection test failed');
      console.error('Connection test error:', error);
    } finally {
      setTestingConnections(false);
    }
  };

  const sendTestAlert = async () => {
    if (!alertConfig.enabled) {
      toast.error('Alerting is disabled. Enable it first.');
      return;
    }

    toast.loading('Sending test alert...');
    
    try {
      const alertingService = new AlertingService(alertConfig);
      
      // Send test alert to all configured channels
      if (alertConfig.channels.slack.enabled && alertConfig.channels.slack.botToken) {
        const slackService = new (await import('../services/slackService')).SlackService(alertConfig.channels.slack.botToken);
        await slackService.sendAlert(
          alertConfig.channels.slack.alertChannelId,
          'test-environment',
          'test-cluster',
          'This is a test alert from the SRE Monitoring Dashboard'
        );
      }
      
      if (alertConfig.channels.email.enabled && alertConfig.channels.email.senderEmail) {
        const emailService = new (await import('../services/emailService')).EmailService(
          alertConfig.channels.email.senderEmail,
          alertConfig.channels.email.appPassword
        );
        await emailService.sendAlert(
          alertConfig.channels.email.recipients,
          'test-environment',
          'test-cluster',
          'This is a test alert from the SRE Monitoring Dashboard'
        );
      }
      
      toast.dismiss();
      toast.success('Test alert sent successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to send test alert');
      console.error('Test alert error:', error);
    }
  };

  const clearAlertState = () => {
    setAlertState({});
    toast.success('Alert state cleared successfully');
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: Bell },
    { id: 'slack', label: 'Slack Config', icon: Slack },
    { id: 'email', label: 'Email Config', icon: Mail },
    { id: 'thresholds', label: 'Thresholds', icon: SettingsIcon },
    { id: 'exclusions', label: 'Exclusions', icon: AlertTriangle }
  ];

  const ongoingAlerts = Object.entries(alertState).filter(([_, state]) => state.status === 'FAIL');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Alerting Configuration</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={testConnections}
              disabled={testingConnections}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{testingConnections ? 'Testing...' : 'Test Connections'}</span>
            </button>
            
            <button
              onClick={sendTestAlert}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Send Test Alert</span>
            </button>
            
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              alertConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {alertConfig.enabled ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {alertConfig.enabled ? 'Alerting Enabled' : 'Alerting Disabled'}
              </span>
            </div>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={alertConfig.enabled}
                onChange={(e) => updateAlertConfig('enabled', '', e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Alerting</span>
            </label>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 p-6 border-r border-gray-200">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Alert Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">Active Channels</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 mt-2">
                      {(alertConfig.channels.slack.enabled ? 1 : 0) + (alertConfig.channels.email.enabled ? 1 : 0)}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-900">Ongoing Alerts</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700 mt-2">{ongoingAlerts.length}</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Reminder Interval</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 mt-2">{alertConfig.thresholds.reminderInterval}h</p>
                  </div>
                </div>

                {ongoingAlerts.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-3">Current Active Alerts</h4>
                    <div className="space-y-2">
                      {ongoingAlerts.map(([testKey, state]) => (
                        <div key={testKey} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <span className="font-medium text-gray-900">{testKey}</span>
                            <p className="text-sm text-gray-600">
                              {state.namespace} • {state.cluster}
                              {state.reason && ` • ${state.reason}`}
                            </p>
                          </div>
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                            {state.firstFailureTimestamp ? 
                              new Date(state.firstFailureTimestamp).toLocaleString() : 
                              'Unknown'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={clearAlertState}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear All Alert States
                    </button>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Integration Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Slack Integration</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alertConfig.channels.slack.enabled && alertConfig.channels.slack.botToken
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {alertConfig.channels.slack.enabled && alertConfig.channels.slack.botToken ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Email Integration</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alertConfig.channels.email.enabled && alertConfig.channels.email.senderEmail
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {alertConfig.channels.email.enabled && alertConfig.channels.email.senderEmail ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Groundcover Logging</span>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'slack' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Slack Configuration</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={alertConfig.channels.slack.enabled}
                      onChange={(e) => updateChannelConfig('slack', 'enabled', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Slack Alerts</span>
                  </label>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Create a Slack app at <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline">api.slack.com/apps</a></li>
                    <li>2. Add the "chat:write" OAuth scope</li>
                    <li>3. Install the app to your workspace</li>
                    <li>4. Copy the Bot User OAuth Token (starts with xoxb-)</li>
                    <li>5. Invite the bot to your alert channels</li>
                  </ol>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bot Token *
                    </label>
                    <input
                      type="password"
                      value={alertConfig.channels.slack.botToken}
                      onChange={(e) => updateChannelConfig('slack', 'botToken', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="xoxb-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Required for Slack integration</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert Channel ID *
                      </label>
                      <input
                        type="text"
                        value={alertConfig.channels.slack.alertChannelId}
                        onChange={(e) => updateChannelConfig('slack', 'alertChannelId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="C091MP3ECQJ"
                      />
                      <p className="text-xs text-gray-500 mt-1">Channel for immediate alerts</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Channel ID *
                      </label>
                      <input
                        type="text"
                        value={alertConfig.channels.slack.reportChannelId}
                        onChange={(e) => updateChannelConfig('slack', 'reportChannelId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="C091MP3ECQJ"
                      />
                      <p className="text-xs text-gray-500 mt-1">Channel for daily reports</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'email' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={alertConfig.channels.email.enabled}
                      onChange={(e) => updateChannelConfig('email', 'enabled', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Email Alerts</span>
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Setup Instructions</h4>
                  <p className="text-sm text-yellow-800">
                    For Gmail: Use an App Password instead of your regular password. 
                    Enable 2FA and generate an App Password in your Google Account settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sender Email *
                      </label>
                      <input
                        type="email"
                        value={alertConfig.channels.email.senderEmail}
                        onChange={(e) => updateChannelConfig('email', 'senderEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="alerts@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        App Password *
                      </label>
                      <input
                        type="password"
                        value={alertConfig.channels.email.appPassword}
                        onChange={(e) => updateChannelConfig('email', 'appPassword', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipients (comma-separated) *
                    </label>
                    <textarea
                      value={alertConfig.channels.email.recipients.join(', ')}
                      onChange={(e) => updateChannelConfig('email', 'recipients', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="user1@company.com, user2@company.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'thresholds' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Alert Thresholds</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Query Response Time Threshold (seconds)
                    </label>
                    <input
                      type="number"
                      value={alertConfig.thresholds.queryResponseTime}
                      onChange={(e) => updateAlertConfig('thresholds', 'queryResponseTime', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="300"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Queries taking longer than this will trigger alerts
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reminder Interval (hours)
                    </label>
                    <input
                      type="number"
                      value={alertConfig.thresholds.reminderInterval}
                      onChange={(e) => updateAlertConfig('thresholds', 'reminderInterval', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="24"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      How often to send reminder alerts for ongoing failures
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'exclusions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Test Exclusions</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excluded Environments (one per line)
                  </label>
                  <textarea
                    value={alertConfig.testExclusions.environments.join('\n')}
                    onChange={(e) => updateAlertConfig('testExclusions', 'environments', e.target.value.split('\n').filter(url => url.trim()))}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://tenant-demo.erag-c1.gigaspaces.net"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Environments listed here will be monitored but won't trigger alerts
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}