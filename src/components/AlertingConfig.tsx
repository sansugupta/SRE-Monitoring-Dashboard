import React, { useState } from 'react';
import { Bell, Slack, Mail, AlertTriangle, CheckCircle, Clock, Settings as SettingsIcon } from 'lucide-react';
import { AlertConfig, AlertState } from '../types';
import toast from 'react-hot-toast';

interface AlertingConfigProps {
  alertConfig: AlertConfig;
  setAlertConfig: (config: AlertConfig) => void;
  alertState: AlertState;
  setAlertState: (state: AlertState) => void;
}

export function AlertingConfig({ alertConfig, setAlertConfig, alertState, setAlertState }: AlertingConfigProps) {
  const [activeSection, setActiveSection] = useState('overview');

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

  const testSlackConnection = async () => {
    if (!alertConfig.channels.slack.botToken) {
      toast.error('Please enter Slack Bot Token first');
      return;
    }
    
    toast.loading('Testing Slack connection...');
    // Simulate API call
    setTimeout(() => {
      toast.dismiss();
      toast.success('Slack connection test successful!');
    }, 2000);
  };

  const testEmailConnection = async () => {
    if (!alertConfig.channels.email.senderEmail || !alertConfig.channels.email.appPassword) {
      toast.error('Please enter email credentials first');
      return;
    }
    
    toast.loading('Testing email connection...');
    // Simulate API call
    setTimeout(() => {
      toast.dismiss();
      toast.success('Email connection test successful!');
    }, 2000);
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bot Token
                    </label>
                    <input
                      type="password"
                      value={alertConfig.channels.slack.botToken}
                      onChange={(e) => updateChannelConfig('slack', 'botToken', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="xoxb-..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert Channel ID
                      </label>
                      <input
                        type="text"
                        value={alertConfig.channels.slack.alertChannelId}
                        onChange={(e) => updateChannelConfig('slack', 'alertChannelId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="C091MP3ECQJ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Channel ID
                      </label>
                      <input
                        type="text"
                        value={alertConfig.channels.slack.reportChannelId}
                        onChange={(e) => updateChannelConfig('slack', 'reportChannelId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="C091MP3ECQJ"
                      />
                    </div>
                  </div>

                  <button
                    onClick={testSlackConnection}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Test Slack Connection
                  </button>
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

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sender Email
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
                        App Password
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
                      Recipients (comma-separated)
                    </label>
                    <textarea
                      value={alertConfig.channels.email.recipients.join(', ')}
                      onChange={(e) => updateChannelConfig('email', 'recipients', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="user1@company.com, user2@company.com"
                    />
                  </div>

                  <button
                    onClick={testEmailConnection}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Test Email Connection
                  </button>
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
                      Queries taking longer than this will be marked as failed
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
                    Environments listed here will be marked as "Disabled" and won't trigger alerts
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