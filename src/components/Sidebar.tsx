import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  Settings, 
  Activity,
  Shield,
  Bell,
  FolderOpen
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar, path: '/scheduler' },
    { id: 'alerting', label: 'Alerting', icon: Bell, path: '/alerting' },
    { id: 'files', label: 'File Manager', icon: FolderOpen, path: '/files' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleNavigation = (item: typeof menuItems[0]) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SRE Monitor</h1>
            <p className="text-sm text-gray-500">Advanced Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Activity className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">System Status</p>
            <p className="text-xs text-green-600">All systems operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}