import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, Textarea, Badge, LoadingSpinner, Icons } from './UIComponents';

export const SearchCases = ({ onNavigate }) => {
  const { apiUrl, getAuthHeaders } = useAuth();
  const [searchType, setSearchType] = useState('natural');
  const [query, setQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({
    text: '',
    start_date: '',
    end_date: '',
    min_confidence: '',
    has_files: false,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleNaturalSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error('Natural search failed');
        setResults([]);
      }
    } catch (error) {
      console.error('Natural search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/cases/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(advancedFilters),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error('Advanced search failed');
        setResults([]);
      }
    } catch (error) {
      console.error('Advanced search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchType === 'natural') {
      handleNaturalSearch();
    } else {
      handleAdvancedSearch();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [field]: value
    }));
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
            Search Cases
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Use natural language queries or advanced filters to find specific cases
          </p>
        </div>

        {/* Search Type Selector */}
        <Card className="mb-6 p-6">
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="natural"
                checked={searchType === 'natural'}
                onChange={(e) => setSearchType(e.target.value)}
                className="mr-2"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Natural Language Search
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="advanced"
                checked={searchType === 'advanced'}
                onChange={(e) => setSearchType(e.target.value)}
                className="mr-2"
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Advanced Filters
              </span>
            </label>
          </div>

          {searchType === 'natural' ? (
            <div className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask in natural language: 'Show me cases from yesterday', 'Find patients with chest pain', 'Cases with lab results showing high glucose', etc."
                rows="3"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try queries like: "today", "yesterday", "lab results", "chest pain", "diabetes", "patient ID P001"
                </p>
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  loading={loading}
                >
                  <Icons.Search />
                  Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Text Search"
                  value={advancedFilters.text}
                  onChange={(e) => handleAdvancedFilterChange('text', e.target.value)}
                  placeholder="Search in case content..."
                />
                <Input
                  label="Minimum Confidence Score"
                  type="number"
                  min="0"
                  max="100"
                  value={advancedFilters.min_confidence}
                  onChange={(e) => handleAdvancedFilterChange('min_confidence', e.target.value)}
                  placeholder="e.g., 75"
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={advancedFilters.start_date}
                  onChange={(e) => handleAdvancedFilterChange('start_date', e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={advancedFilters.end_date}
                  onChange={(e) => handleAdvancedFilterChange('end_date', e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={advancedFilters.has_files}
                    onChange={(e) => handleAdvancedFilterChange('has_files', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-900 dark:text-gray-100">
                    Only cases with attached files
                  </span>
                </label>
                <div className="flex-1"></div>
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  loading={loading}
                >
                  <Icons.Search />
                  Search
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="p-12 text-center">
            <LoadingSpinner size="xl" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Searching cases...
            </p>
          </Card>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Search Results ({results.length} found)
            </h2>
            
            {results.length === 0 ? (
              <div className="text-center py-12">
                <Icons.Search />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                  No cases found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Try adjusting your search criteria or using different keywords.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((case_) => (
                  <Card
                    key={case_.id}
                    className="p-6 hover:shadow-lg cursor-pointer transition-all"
                    onClick={() => onNavigate('case-detail', case_.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {case_.patient_name}
                          </h3>
                          <Badge variant="secondary" size="sm">
                            ID: {case_.patient_id}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                        {case_.chief_complaint && (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Chief Complaint:</span> {case_.chief_complaint}
                          </p>
                        )}
                        {case_.match_score && (
                          <div className="mt-2">
                            <Badge variant="primary" size="sm">
                              Match: {Math.round(case_.match_score)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          variant={case_.analysis_result ? 'success' : 'warning'}
                        >
                          {case_.analysis_result ? 'Analyzed' : 'Pending Analysis'}
                        </Badge>
                        {case_.files && case_.files.length > 0 && (
                          <Badge variant="secondary" size="sm">
                            {case_.files.length} file(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};