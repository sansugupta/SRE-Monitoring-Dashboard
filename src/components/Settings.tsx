import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Key, Globe, RefreshCw, User } from 'lucide-react';
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
          logging: 'Sv4ZAQmKdVrrd7K1fKj4TMALxhZWrvsA',
          data: 'p30o3dlvKYNoqqTZHoIpsUZuWwjHg8xP'
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
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
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.credentials.password}
                      onChange={(e) => updateFormData('credentials', 'password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'environments' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Environment Configuration</h3>
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