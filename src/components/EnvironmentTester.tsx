import React, { useState } from 'react';
import { Play, Square, Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { AppConfig } from '../types';
import toast from 'react-hot-toast';

interface EnvironmentTesterProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onRunTests: (urls: string[], exclusions: string[]) => Promise<void>;
  isRunning: boolean;
}

export function EnvironmentTester({ config, setConfig, onRunTests, isRunning }: EnvironmentTesterProps) {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAddUrl = () => {
    if (newUrl.trim() && !config.environmentUrls.includes(newUrl.trim())) {
      const updatedUrls = [...config.environmentUrls, newUrl.trim()];
      setConfig({
        ...config,
        environmentUrls: updatedUrls
      });
      setNewUrl('');
      toast.success('Environment URL added');
    }
  };

  const handleRemoveUrl = (url: string) => {
    const updatedUrls = config.environmentUrls.filter(u => u !== url);
    setConfig({
      ...config,
      environmentUrls: updatedUrls
    });
    setSelectedUrls(selectedUrls.filter(u => u !== url));
    toast.success('Environment URL removed');
  };

  const handleAddExclusion = () => {
    if (newExclusion.trim() && !exclusions.includes(newExclusion.trim())) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
      toast.success('Exclusion added');
    }
  };

  const handleRemoveExclusion = (exclusion: string) => {
    setExclusions(exclusions.filter(e => e !== exclusion));
    toast.success('Exclusion removed');
  };

  const handleRunTests = async () => {
    const urlsToTest = selectedUrls.length > 0 ? selectedUrls : config.environmentUrls;
    
    if (urlsToTest.length === 0) {
      toast.error('No environments selected for testing');
      return;
    }

    await onRunTests(urlsToTest, exclusions);
  };

  const handleSelectAll = () => {
    if (selectedUrls.length === config.environmentUrls.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls([...config.environmentUrls]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Environment Testing</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
          
          <button
            onClick={handleRunTests}
            disabled={isRunning || config.environmentUrls.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Environment URLs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Environment URLs</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedUrls.length === config.environmentUrls.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">
              ({selectedUrls.length} of {config.environmentUrls.length} selected)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {config.environmentUrls.map((url, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                checked={selectedUrls.includes(url)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUrls([...selectedUrls, url]);
                  } else {
                    setSelectedUrls(selectedUrls.filter(u => u !== url));
                  }
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1 text-sm text-gray-900 font-mono">{url}</span>
              <button
                onClick={() => handleRemoveUrl(url)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Remove URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://tenant-example.erag-c1.gigaspaces.net"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddUrl}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          <h4 className="font-medium text-gray-900">Test Exclusions</h4>
          <p className="text-sm text-gray-600">
            URLs listed here will be monitored but won't trigger alerts or be included in failure counts.
          </p>

          <div className="space-y-2">
            {exclusions.map((exclusion, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="flex-1 text-sm text-gray-900 font-mono">{exclusion}</span>
                <button
                  onClick={() => handleRemoveExclusion(exclusion)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Remove exclusion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="url"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              placeholder="https://tenant-example.erag-c1.gigaspaces.net"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddExclusion}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exclusion</span>
            </button>
          </div>
        </div>
      )}

      {config.environmentUrls.length === 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            No environment URLs configured. Add some URLs above to start testing.
          </p>
        </div>
      )}
    </div>
  );
}