import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, LoadingSpinner, Icons, Badge, CollapsibleSection } from './UIComponents';
import { VoiceCommand } from './VoiceComponents';

export const VoiceCommandInterface = ({ onNavigate }) => {
  const { apiUrl, getAuthHeaders, user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const exampleQueries = [
    "Show yesterday's cases",
    "Find cases from last week",
    "Show CBC results for patient 12345",
    "Find chest X-ray cases",
    "Show high confidence cases",
    "Cases with diabetes",
    "Lab results from today",
    "Show cases with fever",
    "Find cardiology cases",
    "Recent imaging studies"
  ];

  const handleVoiceCommand = (command) => {
    setQuery(command);
    executeQuery(command);
  };

  const handleTextQuery = () => {
    if (query.trim()) {
      executeQuery(query);
    }
  };

  const executeQuery = async (queryText) => {
    if (!queryText.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          query: queryText,
          doctor_id: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Query failed');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTextQuery();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => onNavigate('dashboard')}
            className="mb-4"
          >
            <Icons.ArrowLeft />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            🎤 Voice Command Interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ask questions about your cases using voice commands or text queries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Interface */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🗣️ Ask a Question
              </h2>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your question or use voice command..."
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    onClick={handleTextQuery}
                    disabled={!query.trim() || loading}
                  >
                    <Icons.Search />
                    Search
                  </Button>
                </div>

                <div className="flex justify-center">
                  <VoiceCommand 
                    onCommand={handleVoiceCommand}
                    className="w-full justify-center"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Loading State */}
            {loading && (
              <Card className="p-8 text-center">
                <LoadingSpinner size="xl" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                  🤖 Processing Your Query
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Analyzing: "{query}"
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>🔍</span>
                    <span>Understanding query intent</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>📊</span>
                    <span>Searching medical records</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>📝</span>
                    <span>Preparing results</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Results */}
            {results && (
              <div className="space-y-6">
                {/* AI Response */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    🤖 AI Response
                  </h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200">{results.response}</p>
                  </div>
                </Card>

                {/* Query Analysis */}
                {results.query_analysis && (
                  <CollapsibleSection title="🔍 Query Analysis">
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Query Type</h4>
                          <Badge variant="primary">{results.query_analysis.query_type}</Badge>
                        </div>
                        {results.query_analysis.medical_terms && results.query_analysis.medical_terms.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Medical Terms</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {results.query_analysis.medical_terms.map((term, index) => (
                                <Badge key={index} variant="secondary" size="sm">{term}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.query_analysis.patient_info && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Patient Info</h4>
                            <p className="text-gray-700 dark:text-gray-300">
                              {JSON.stringify(results.query_analysis.patient_info, null, 2)}
                            </p>
                          </div>
                        )}
                        {results.query_analysis.date_filter && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Date Filter</h4>
                            <Badge variant="warning">{results.query_analysis.date_filter.type}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Cases Found */}
                {results.cases && results.cases.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      📋 Cases Found ({results.cases.length})
                    </h3>
                    <div className="space-y-4">
                      {results.cases.map((case_, index) => (
                        <div
                          key={case_.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => onNavigate('case-detail', case_.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {case_.patient_name}
                                </h4>
                                <Badge variant="secondary" size="sm">
                                  ID: {case_.patient_id}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div>Age: {case_.patient_age} years</div>
                                <div>Gender: {case_.patient_gender}</div>
                                <div>Created: {new Date(case_.created_at).toLocaleDateString()}</div>
                              </div>
                              {case_.chief_complaint && (
                                <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                                  <span className="font-medium">Chief Complaint:</span> {case_.chief_complaint}
                                </p>
                              )}
                              {case_.confidence_score && (
                                <div className="mt-2">
                                  <Badge 
                                    variant={case_.confidence_score > 80 ? 'success' : case_.confidence_score > 60 ? 'warning' : 'secondary'}
                                    size="sm"
                                  >
                                    Confidence: {case_.confidence_score}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge
                                variant={case_.analysis_result ? 'success' : 'warning'}
                              >
                                {case_.analysis_result ? 'Analyzed' : 'Pending'}
                              </Badge>
                              {case_.uploaded_files && case_.uploaded_files.length > 0 && (
                                <Badge variant="primary" size="sm">
                                  {case_.uploaded_files.length} file(s)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {results.cases && results.cases.length === 0 && (
                  <Card className="p-8 text-center">
                    <Icons.Search />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                      No Cases Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Try adjusting your query or using different keywords.
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Examples Sidebar */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                💡 Example Queries
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Try these example questions:
              </p>
              <div className="space-y-2">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(example)}
                    className="w-full text-left p-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <span className="text-primary-600 dark:text-primary-400">❝</span>
                    <span className="text-gray-700 dark:text-gray-300 ml-1">{example}</span>
                    <span className="text-primary-600 dark:text-primary-400">❞</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🎯 Query Tips
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Date Queries:</span>
                  <br />Use "yesterday", "today", "last week", "this month"
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Patient Search:</span>
                  <br />Include patient ID or name in your query
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Medical Terms:</span>
                  <br />Use specific conditions, tests, or symptoms
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">File Types:</span>
                  <br />Search for "lab", "imaging", "X-ray", "CBC"
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};