import React, { useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { AppConfig } from '../types';

interface SetupProps {
  onComplete: () => void;
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export function Setup({ onComplete, config, setConfig }: SetupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(config);

  const updateFormData = (section: keyof AppConfig, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: field === '' ? value : {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleComplete = () => {
    setConfig(formData);
    onComplete();
  };

  const steps = [
    { id: 1, title: 'API Keys', description: 'Set up monitoring API keys' },
    { id: 2, title: 'Notifications', description: 'Configure email and Slack' },
    { id: 3, title: 'Environments', description: 'Add monitoring URLs' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Production Monitor Setup</h1>
          <p className="text-gray-600">Configure your monitoring dashboard to get started</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step > stepItem.id ? 'bg-green-500 text-white' :
                  step === stepItem.id ? 'bg-blue-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepItem.id ? <CheckCircle className="w-5 h-5" /> : stepItem.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step > stepItem.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">API Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logging API Key
                  </label>
                  <input
                    type="text"
                    value={formData.apiKeys.logging}
                    onChange={(e) => updateFormData('apiKeys', 'logging', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter logging API key"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data API Key
                  </label>
                  <input
                    type="text"
                    value={formData.apiKeys.data}
                    onChange={(e) => updateFormData('apiKeys', 'data', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter data API key"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Groundcover Logging URL
                    </label>
                    <input
                      type="url"
                      value={formData.endpoints.groundcoverLogging}
                      onChange={(e) => updateFormData('endpoints', 'groundcoverLogging', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Victoria Metrics URL
                    </label>
                    <input
                      type="url"
                      value={formData.endpoints.victoriaMetrics}
                      onChange={(e) => updateFormData('endpoints', 'victoriaMetrics', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ClickHouse URL
                    </label>
                    <input
                      type="url"
                      value={formData.endpoints.clickhouse}
                      onChange={(e) => updateFormData('endpoints', 'clickhouse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Email Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Email
                    </label>
                    <input
                      type="email"
                      value={formData.emailSettings.senderEmail}
                      onChange={(e) => updateFormData('emailSettings', 'senderEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="notifications@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Password
                    </label>
                    <input
                      type="password"
                      value={formData.emailSettings.appPassword}
                      onChange={(e) => updateFormData('emailSettings', 'appPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipients (comma-separated)
                    </label>
                    <textarea
                      value={formData.emailSettings.recipients.join(', ')}
                      onChange={(e) => updateFormData('emailSettings', 'recipients', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="user1@company.com, user2@company.com"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Slack Configuration</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bot Token
                    </label>
                    <input
                      type="text"
                      value={formData.slackSettings.botToken}
                      onChange={(e) => updateFormData('slackSettings', 'botToken', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="xoxb-..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel ID
                    </label>
                    <input
                      type="text"
                      value={formData.slackSettings.channelId}
                      onChange={(e) => updateFormData('slackSettings', 'channelId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="C08UUK12G74"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Environment Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Environment URLs (one per line)
                  </label>
                  <textarea
                    value={formData.environmentUrls.join('\n')}
                    onChange={(e) => updateFormData('environmentUrls', '', e.target.value.split('\n').filter(url => url.trim()))}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://tenant-demo.erag-c1.gigaspaces.net"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Distribution URLs (one per line)
                  </label>
                  <textarea
                    value={formData.errorDistUrls.join('\n')}
                    onChange={(e) => updateFormData('errorDistUrls', '', e.target.value.split('\n').filter(url => url.trim()))}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://tenant-tempo2.ws-use1.gigaspaces.net"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}