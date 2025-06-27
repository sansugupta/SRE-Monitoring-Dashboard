import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Globe, RefreshCw, User, Eye, EyeOff } from 'lucide-react';
import { AppConfig } from '../types';
import toast from 'react-hot-toast';

interface SettingsProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
}

export function Settings({ config, setConfig }: SettingsProps) {
  const [formData, setFormData] = useState(config);
  const [activeSection, setActiveSection] = useState('api');
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const updateFormData = (section: keyof AppConfig, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: field === '' ? value : {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setConfig(formData);
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      const defaultConfig: AppConfig = {
        apiKeys: {
          logging: '',
          data: ''
        },
        endpoints: {
          groundcoverLogging: 'https://grgrer.platform.grcv.io/json/logs',
          victoriaMetrics: 'https://ds.groundcover.com/datasources/prometheus/api/v1/query_range',
          clickhouse: 'https://ds.groundcover.com/'
        },
        environmentUrls: [],
        errorDistUrls: [],
        credentials: {
          email: '',
          password: ''
        },
        applicationIds: {
          default: 'ac115209-2353-4271-84f7-e2aa67090286',
          environmentSpecific: {}
        }
      };
      setFormData(defaultConfig);
      toast.success('Settings reset to defaults');
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const sections = [
    { id: 'api', label: 'API Configuration', icon: Globe },
    { id: 'credentials', label: 'Credentials', icon: User },
    { id: 'environments', label: 'Environments', icon: RefreshCw },
    { id: 'applications', label: 'Application IDs', icon: Key }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Application Settings</h2>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
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
            {activeSection === 'api' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Required Configuration</h4>
                  <p className="text-sm text-yellow-800">
                    Both API keys are required for the dashboard to function properly. The logging API key is used for sending logs to Groundcover, 
                    and the data API key is used for fetching metrics and error distributions.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logging API Key *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.logging ? 'text' : 'password'}
                          value={formData.apiKeys.logging}
                          onChange={(e) => updateFormData('apiKeys', 'logging', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter logging API key"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('logging')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.logging ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data API Key *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.data ? 'text' : 'password'}
                          value={formData.apiKeys.data}
                          onChange={(e) => updateFormData('apiKeys', 'data', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter data API key"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('data')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.data ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-800">API Endpoints</h4>
                    <div className="grid grid-cols-1 gap-4">
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
              </div>
            )}

            {activeSection === 'credentials' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Authentication Credentials</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Environment Login Credentials</h4>
                  <p className="text-sm text-blue-800">
                    These credentials are used to authenticate with the production environments during testing. 
                    They should have access to all environments you want to monitor.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.credentials.email}
                      onChange={(e) => updateFormData('credentials', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="user@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.password ? 'text' : 'password'}
                        value={formData.credentials.password}
                        onChange={(e) => updateFormData('credentials', 'password', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.password ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'environments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Environment Configuration</h3>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Environment URLs</h4>
                  <p className="text-sm text-green-800">
                    Configure the environment URLs that will be monitored. You can also manage these in the Environment Testing section.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Environment URLs (one per line)
                    </label>
                    <textarea
                      value={formData.environmentUrls.join('\n')}
                      onChange={(e) => updateFormData('environmentUrls', '', e.target.value.split('\n').filter(url => url.trim()))}
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://tenant-tempo2.ws-use1.gigaspaces.net"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'applications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Application ID Configuration</h3>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Application IDs</h4>
                  <p className="text-sm text-purple-800">
                    Configure application IDs used for authentication with different environments. 
                    Each environment may require a specific application ID for proper access.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Application ID
                    </label>
                    <input
                      type="text"
                      value={formData.applicationIds.default}
                      onChange={(e) => updateFormData('applicationIds', 'default', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ac115209-2353-4271-84f7-e2aa67090286"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Default application ID used for all environments unless overridden
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Environment-Specific Application IDs
                    </label>
                    <div className="space-y-2">
                      {Object.entries(formData.applicationIds.environmentSpecific).map(([url, appId], index) => (
                        <div key={index} className="flex space-x-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const newEnvSpecific = { ...formData.applicationIds.environmentSpecific };
                              delete newEnvSpecific[url];
                              newEnvSpecific[e.target.value] = appId;
                              updateFormData('applicationIds', 'environmentSpecific', newEnvSpecific);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Environment URL"
                          />
                          <input
                            type="text"
                            value={appId}
                            onChange={(e) => {
                              const newEnvSpecific = { ...formData.applicationIds.environmentSpecific };
                              newEnvSpecific[url] = e.target.value;
                              updateFormData('applicationIds', 'environmentSpecific', newEnvSpecific);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Application ID"
                          />
                          <button
                            onClick={() => {
                              const newEnvSpecific = { ...formData.applicationIds.environmentSpecific };
                              delete newEnvSpecific[url];
                              updateFormData('applicationIds', 'environmentSpecific', newEnvSpecific);
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newEnvSpecific = { ...formData.applicationIds.environmentSpecific };
                          newEnvSpecific[''] = '';
                          updateFormData('applicationIds', 'environmentSpecific', newEnvSpecific);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Environment-Specific ID
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Override the default application ID for specific environments
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}