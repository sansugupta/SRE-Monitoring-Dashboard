import React, { useState } from 'react';
import { Calendar, Clock, Mail, MessageSquare, Play, Pause, Zap, FileText } from 'lucide-react';
import { AppConfig, AlertConfig, ScheduleConfig } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import toast from 'react-hot-toast';

interface SchedulerProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  alertConfig: AlertConfig;
  setAlertConfig: (config: AlertConfig) => void;
}

export function Scheduler({ config, setConfig, alertConfig, setAlertConfig }: SchedulerProps) {
  const [scheduleConfig, setScheduleConfig] = useLocalStorage('scheduleConfig', {
    monitoringInterval: 5,
    reportGeneration: {
      enabled: true,
      time: '08:00',
      timezone: 'Asia/Jerusalem'
    },
    emailNotifications: {
      enabled: true,
      dailyReport: true,
      alerts: true
    },
    slackNotifications: {
      enabled: true,
      dailyReport: true,
      alerts: true
    }
  });

  const [isScheduleActive, setIsScheduleActive] = useLocalStorage('scheduleActive', false);
  const [executionMode, setExecutionMode] = useState<'frequent' | 'daily'>('frequent');

  const updateScheduleConfig = (section: string, field: string, value: any) => {
    setScheduleConfig(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' ? {
        ...prev[section],
        [field]: value
      } : value
    }));
  };

  const toggleSchedule = () => {
    setIsScheduleActive(!isScheduleActive);
    toast.success(isScheduleActive ? 'Schedule disabled' : 'Schedule enabled');
  };

  const runManualExecution = (mode: 'frequent' | 'daily') => {
    setExecutionMode(mode);
    toast.loading(`Running ${mode} mode execution...`);
    
    // Simulate execution
    setTimeout(() => {
      toast.dismiss();
      toast.success(`${mode} mode execution completed successfully`);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Automated Scheduling</h2>
          </div>
          
          <button
            onClick={toggleSchedule}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isScheduleActive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isScheduleActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isScheduleActive ? 'Disable Schedule' : 'Enable Schedule'}</span>
          </button>
        </div>

        {/* Execution Mode Controls */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Execution</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => runManualExecution('frequent')}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Run Frequent Mode</span>
            </button>
            
            <button
              onClick={() => runManualExecution('daily')}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Run Daily Mode</span>
            </button>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <p><strong>Frequent Mode:</strong> Runs environment checks and stateful alerting</p>
            <p><strong>Daily Mode:</strong> Generates PDF reports and sends notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monitoring Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Monitoring Schedule</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">Monitoring Interval</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Run monitoring every (minutes)
                  </label>
                  <select
                    value={scheduleConfig.monitoringInterval}
                    onChange={(e) => updateScheduleConfig('monitoringInterval', '', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-600">
                  Next run: {isScheduleActive ? `In ${scheduleConfig.monitoringInterval} minutes` : 'Schedule disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Report Generation */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Report Generation</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.reportGeneration.enabled}
                    onChange={(e) => updateScheduleConfig('reportGeneration', 'enabled', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable daily reports</span>
                </label>
                
                {scheduleConfig.reportGeneration.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily report time
                      </label>
                      <input
                        type="time"
                        value={scheduleConfig.reportGeneration.time}
                        onChange={(e) => updateScheduleConfig('reportGeneration', 'time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={scheduleConfig.reportGeneration.timezone}
                        onChange={(e) => updateScheduleConfig('reportGeneration', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Notifications */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Mail className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">Email Notifications</span>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.emailNotifications.enabled}
                    onChange={(e) => updateScheduleConfig('emailNotifications', 'enabled', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable email notifications</span>
                </label>
                
                {scheduleConfig.emailNotifications.enabled && (
                  <>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.emailNotifications.dailyReport}
                        onChange={(e) => updateScheduleConfig('emailNotifications', 'dailyReport', e.target.checked)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Daily reports</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.emailNotifications.alerts}
                        onChange={(e) => updateScheduleConfig('emailNotifications', 'alerts', e.target.checked)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Alert notifications</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Slack Notifications */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-900">Slack Notifications</span>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scheduleConfig.slackNotifications.enabled}
                    onChange={(e) => updateScheduleConfig('slackNotifications', 'enabled', e.target.checked)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Slack notifications</span>
                </label>
                
                {scheduleConfig.slackNotifications.enabled && (
                  <>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.slackNotifications.dailyReport}
                        onChange={(e) => updateScheduleConfig('slackNotifications', 'dailyReport', e.target.checked)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Daily reports</span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scheduleConfig.slackNotifications.alerts}
                        onChange={(e) => updateScheduleConfig('slackNotifications', 'alerts', e.target.checked)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Alert notifications</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Status */}
        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isScheduleActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="font-medium text-gray-900">
              Schedule Status: {isScheduleActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isScheduleActive 
              ? `Monitoring runs every ${scheduleConfig.monitoringInterval} minute(s). Daily reports ${scheduleConfig.reportGeneration.enabled ? `at ${scheduleConfig.reportGeneration.time}` : 'disabled'}.`
              : 'All scheduled tasks are disabled. Enable the schedule to start automated monitoring and reporting.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}