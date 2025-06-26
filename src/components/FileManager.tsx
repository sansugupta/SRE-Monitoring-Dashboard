import React, { useState } from 'react';
import { FolderOpen, File, Upload, Download, Trash2, Edit, Save, X } from 'lucide-react';
import { FileConfig } from '../types';
import toast from 'react-hot-toast';

interface FileManagerProps {
  fileConfig: FileConfig;
  setFileConfig: (config: FileConfig) => void;
}

export function FileManager({ fileConfig, setFileConfig }: FileManagerProps) {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  const updateFileConfig = (field: string, value: string) => {
    if (field === 'baseDirectory') {
      setFileConfig({
        ...fileConfig,
        baseDirectory: value
      });
    } else {
      setFileConfig({
        ...fileConfig,
        files: {
          ...fileConfig.files,
          [field]: value
        }
      });
    }
  };

  const handleFileUpload = (fileKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContents(prev => ({
          ...prev,
          [fileKey]: content
        }));
        toast.success(`${file.name} uploaded successfully`);
      };
      reader.readAsText(file);
    }
  };

  const handleSaveFile = (fileKey: string) => {
    // Simulate saving file
    toast.success(`${fileKey} saved successfully`);
    setEditingFile(null);
  };

  const handleDeleteFile = (fileKey: string) => {
    if (confirm(`Are you sure you want to delete ${fileKey}?`)) {
      setFileContents(prev => {
        const newContents = { ...prev };
        delete newContents[fileKey];
        return newContents;
      });
      toast.success(`${fileKey} deleted successfully`);
    }
  };

  const downloadFile = (fileKey: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileKey;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${fileKey} downloaded`);
  };

  const fileTypes = [
    { key: 'envList', label: 'Environment List', description: 'List of production environment URLs' },
    { key: 'errorDistEnvs', label: 'Error Distribution Envs', description: 'URLs for error distribution analysis' },
    { key: 'logo', label: 'Logo Image', description: 'Company logo for PDF reports' },
    { key: 'checkIcon', label: 'Check Icon', description: 'Success indicator icon' },
    { key: 'timesIcon', label: 'Times Icon', description: 'Failure indicator icon' },
    { key: 'exclamationIcon', label: 'Exclamation Icon', description: 'Warning indicator icon' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">File Manager</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Base Directory Configuration */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Base Directory Configuration</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Directory Path
              </label>
              <input
                type="text"
                value={fileConfig.baseDirectory}
                onChange={(e) => updateFileConfig('baseDirectory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/home/erag-noc/scripts/DailyReport-Script"
              />
              <p className="text-sm text-gray-500 mt-1">
                Root directory where all script files are located
              </p>
            </div>
          </div>

          {/* File Management */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">File Management</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {fileTypes.map((fileType) => (
                <div key={fileType.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-gray-500" />
                      <h4 className="font-medium text-gray-900">{fileType.label}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileContents[fileType.key] && (
                        <>
                          <button
                            onClick={() => downloadFile(fileType.key, fileContents[fileType.key])}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingFile(fileType.key)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFile(fileType.key)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{fileType.description}</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File Path
                      </label>
                      <input
                        type="text"
                        value={fileConfig.files[fileType.key as keyof typeof fileConfig.files]}
                        onChange={(e) => updateFileConfig(fileType.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder={`${fileType.key}.txt`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload File
                      </label>
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(fileType.key, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        accept={fileType.key.includes('Icon') || fileType.key === 'logo' ? 'image/*' : '.txt,.json'}
                      />
                    </div>

                    {fileContents[fileType.key] && (
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-xs text-green-600 font-medium">✓ File loaded</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Editor Modal */}
          {editingFile && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editing: {fileTypes.find(f => f.key === editingFile)?.label}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSaveFile(editingFile)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setEditingFile(null)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <textarea
                    value={fileContents[editingFile] || ''}
                    onChange={(e) => setFileContents(prev => ({
                      ...prev,
                      [editingFile]: e.target.value
                    }))}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter file content here..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}