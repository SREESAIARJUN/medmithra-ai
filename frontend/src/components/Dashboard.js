import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card, Badge, LoadingSpinner, ThemeToggle, Icons } from './UIComponents';

export const Dashboard = ({ onNavigate }) => {
  const { user, logout, apiUrl, getAuthHeaders } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    totalCases: 0,
    todayCases: 0,
    pendingAnalysis: 0,
    completedAnalysis: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch cases
      const casesResponse = await fetch(`${apiUrl}/api/cases`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (casesResponse.ok) {
        const cases = await casesResponse.json();
        
        // Calculate stats
        const today = new Date().toDateString();
        const todayCases = cases.filter(c => new Date(c.created_at).toDateString() === today);
        const pendingAnalysis = cases.filter(c => !c.analysis_result);
        const completedAnalysis = cases.filter(c => c.analysis_result);

        setStats({
          totalCases: cases.length,
          todayCases: todayCases.length,
          pendingAnalysis: pendingAnalysis.length,
          completedAnalysis: completedAnalysis.length,
        });

        // Set recent cases (last 5)
        setRecentCases(cases.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Clinical Insight Assistant
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, Dr. {user?.full_name || user?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle isDark={isDark} toggle={toggleTheme} />
              <Button variant="secondary" onClick={() => onNavigate('profile')}>
                <Icons.User />
                Profile
              </Button>
              <Button variant="error" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card">
            <div className="stat-number text-primary-600">{stats.totalCases}</div>
            <div className="stat-label">Total Cases</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-number text-success-600">{stats.todayCases}</div>
            <div className="stat-label">Today's Cases</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-number text-warning-600">{stats.pendingAnalysis}</div>
            <div className="stat-label">Pending Analysis</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-number text-medical-600">{stats.completedAnalysis}</div>
            <div className="stat-label">Completed Analysis</div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => onNavigate('create-case')}
            >
              <Icons.Plus />
              New Case
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => onNavigate('cases')}
            >
              <Icons.Cases />
              View Cases
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => onNavigate('search')}
            >
              <Icons.Search />
              Search Cases
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => onNavigate('profile')}
            >
              <Icons.User />
              Profile Settings
            </Button>
          </div>
        </Card>

        {/* Recent Cases */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Recent Cases
            </h2>
            <Button
              variant="secondary"
              onClick={() => onNavigate('cases')}
            >
              View All
            </Button>
          </div>
          
          {recentCases.length === 0 ? (
            <div className="text-center py-12">
              <Icons.Cases />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                No cases yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create your first case to get started with clinical insights.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => onNavigate('create-case')}
              >
                <Icons.Plus />
                Create First Case
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCases.map((case_) => (
                <div
                  key={case_.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('case-detail', case_.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {case_.patient_name} (ID: {case_.patient_id})
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {case_.patient_age} years old • {case_.patient_gender}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {case_.chief_complaint || 'No chief complaint recorded'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge
                        variant={case_.analysis_result ? 'success' : 'warning'}
                        size="sm"
                      >
                        {case_.analysis_result ? 'Analyzed' : 'Pending'}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(case_.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};