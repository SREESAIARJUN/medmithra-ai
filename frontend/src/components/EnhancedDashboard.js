import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card, Badge, LoadingSpinner, ThemeToggle, Icons } from './UIComponents';

export const EnhancedDashboard = ({ onNavigate }) => {
  const { user, logout, apiUrl, getAuthHeaders } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    totalCases: 0,
    todayCases: 0,
    pendingAnalysis: 0,
    completedAnalysis: 0,
    avgConfidenceScore: 0,
    totalFiles: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchFeedbackStats();
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
        
        // Calculate average confidence score
        const casesWithConfidence = cases.filter(c => c.confidence_score);
        const avgConfidence = casesWithConfidence.length > 0 
          ? Math.round(casesWithConfidence.reduce((sum, c) => sum + c.confidence_score, 0) / casesWithConfidence.length)
          : 0;

        // Calculate total files
        const totalFiles = cases.reduce((sum, c) => sum + (c.uploaded_files ? c.uploaded_files.length : 0), 0);

        setStats({
          totalCases: cases.length,
          todayCases: todayCases.length,
          pendingAnalysis: pendingAnalysis.length,
          completedAnalysis: completedAnalysis.length,
          avgConfidenceScore: avgConfidence,
          totalFiles: totalFiles,
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

  const fetchFeedbackStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/feedback/stats`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackStats(data);
      }
    } catch (error) {
      console.error('Error fetching feedback stats:', error);
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
                🩺 Clinical Insight Assistant
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
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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
            <div className="stat-label">AI Analyzed</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-number text-purple-600">{stats.avgConfidenceScore}%</div>
            <div className="stat-label">Avg Confidence</div>
          </Card>
          <Card className="stat-card">
            <div className="stat-number text-blue-600">{stats.totalFiles}</div>
            <div className="stat-label">Files Processed</div>
          </Card>
        </div>

        {/* AI Performance Card */}
        {feedbackStats && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🤖 AI Performance Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {feedbackStats.positive_feedback || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Positive Feedback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {feedbackStats.negative_feedback || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Negative Feedback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {feedbackStats.total_feedback || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {feedbackStats.satisfaction_rate ? `${feedbackStats.satisfaction_rate}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rate</div>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Quick Actions */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🚀 AI-Powered Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full h-20 flex-col"
              onClick={() => onNavigate('multimodal-entry')}
            >
              <span className="text-2xl mb-1">🩺</span>
              <span>AI Analysis</span>
              <span className="text-xs opacity-80">Voice + Files</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-20 flex-col"
              onClick={() => onNavigate('voice-commands')}
            >
              <span className="text-2xl mb-1">🎤</span>
              <span>Voice Commands</span>
              <span className="text-xs opacity-80">Ask AI Questions</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-20 flex-col"
              onClick={() => onNavigate('cases')}
            >
              <span className="text-2xl mb-1">📋</span>
              <span>View Cases</span>
              <span className="text-xs opacity-80">Browse & Search</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full h-20 flex-col"
              onClick={() => onNavigate('create-case')}
            >
              <span className="text-2xl mb-1">➕</span>
              <span>Traditional Entry</span>
              <span className="text-xs opacity-80">Form-based</span>
            </Button>
          </div>
        </Card>

        {/* Recent Cases with AI Insights */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              📊 Recent AI Analyzed Cases
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
              <span className="text-6xl mb-4 block">🩺</span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                Ready for AI-Powered Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create your first case with voice dictation and file uploads for comprehensive AI insights.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => onNavigate('multimodal-entry')}
              >
                <span className="mr-2">🚀</span>
                Start AI Analysis
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
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {case_.patient_name} (ID: {case_.patient_id})
                        </h3>
                        {case_.confidence_score && (
                          <Badge 
                            variant={case_.confidence_score > 80 ? 'success' : case_.confidence_score > 60 ? 'warning' : 'secondary'}
                            size="sm"
                          >
                            {case_.confidence_score}% Confidence
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Age:</span> {case_.patient_age} years
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span> {case_.patient_gender}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(case_.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {case_.chief_complaint || 'No chief complaint recorded'}
                      </p>
                      
                      {/* AI Analysis Summary */}
                      {case_.analysis_result && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            🤖 AI Insights Available
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {case_.analysis_result.soap_note && (
                              <Badge variant="primary" size="sm">SOAP Notes</Badge>
                            )}
                            {case_.analysis_result.differential_diagnoses && (
                              <Badge variant="warning" size="sm">Diagnoses</Badge>
                            )}
                            {case_.analysis_result.treatment_recommendations && (
                              <Badge variant="success" size="sm">Treatment</Badge>
                            )}
                            {case_.analysis_result.file_interpretations && case_.analysis_result.file_interpretations.length > 0 && (
                              <Badge variant="secondary" size="sm">
                                {case_.analysis_result.file_interpretations.length} File Analysis
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge
                        variant={case_.analysis_result ? 'success' : 'warning'}
                      >
                        {case_.analysis_result ? 'AI Analyzed' : 'Pending'}
                      </Badge>
                      {case_.uploaded_files && case_.uploaded_files.length > 0 && (
                        <Badge variant="secondary" size="sm">
                          {case_.uploaded_files.length} file(s)
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(case_.created_at).toLocaleTimeString()}
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