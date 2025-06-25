import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Badge, LoadingSpinner, Icons, CollapsibleSection } from './UIComponents';

export const CaseDetail = ({ caseId, onNavigate }) => {
  const { apiUrl, getAuthHeaders } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (caseId) {
      fetchCaseDetail();
    }
  }, [caseId]);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/cases/${caseId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCaseData(data);
      } else {
        setError('Failed to load case details');
      }
    } catch (error) {
      setError('Error loading case details');
      console.error('Error fetching case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (analyzing) return;
    
    setAnalyzing(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/cases/${caseId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCaseData(prev => ({
          ...prev,
          analysis_result: data.analysis_result
        }));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Analysis failed');
      }
    } catch (error) {
      setError('Network error during analysis');
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedback = async (isPositive) => {
    try {
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          case_id: caseId,
          feedback_type: isPositive ? 'positive' : 'negative',
          comments: feedback,
        }),
      });

      if (response.ok) {
        setFeedback('');
        alert('Feedback submitted successfully!');
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/cases/${caseId}/export-pdf`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `case_${caseData.patient_name}_${caseData.patient_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('PDF export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Error Loading Case
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => onNavigate('cases')}>
            Back to Cases
          </Button>
        </Card>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Case Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested case could not be found.
          </p>
          <Button variant="secondary" onClick={() => onNavigate('cases')}>
            Back to Cases
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => onNavigate('cases')}
            className="mb-4"
          >
            <Icons.ArrowLeft />
            Back to Cases
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {caseData.patient_name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Patient ID: {caseData.patient_id} • {caseData.patient_age} years old • {caseData.patient_gender}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={caseData.analysis_result ? 'success' : 'warning'}
                size="lg"
              >
                {caseData.analysis_result ? 'Analyzed' : 'Not Analyzed'}
              </Badge>
              <Button variant="secondary" onClick={handleExportPDF}>
                <Icons.Download />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Patient Information
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                  <p className="text-gray-900 dark:text-gray-100">{caseData.patient_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>
                  <p className="text-gray-900 dark:text-gray-100">{caseData.patient_id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Age:</span>
                  <p className="text-gray-900 dark:text-gray-100">{caseData.patient_age} years</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Gender:</span>
                  <p className="text-gray-900 dark:text-gray-100">{caseData.patient_gender}</p>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(caseData.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Analysis Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Clinical Analysis
            </h2>
            {!caseData.analysis_result ? (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This case has not been analyzed yet. Click below to generate AI-powered clinical insights.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleAnalyze}
                  loading={analyzing}
                >
                  <Icons.Analysis />
                  {analyzing ? 'Analyzing...' : 'Generate Analysis'}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Badge variant="success" size="lg" className="mb-4">
                  Analysis Complete
                </Badge>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Clinical analysis has been generated using AI. Review the results below.
                </p>
                <Button
                  variant="secondary"
                  onClick={handleAnalyze}
                  loading={analyzing}
                >
                  <Icons.Analysis />
                  {analyzing ? 'Re-analyzing...' : 'Re-analyze'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Clinical Information */}
        <div className="mt-6 space-y-6">
          {caseData.chief_complaint && (
            <CollapsibleSection title="Chief Complaint" defaultOpen>
              <p className="text-gray-700 dark:text-gray-300">{caseData.chief_complaint}</p>
            </CollapsibleSection>
          )}

          {caseData.history_present_illness && (
            <CollapsibleSection title="History of Present Illness">
              <p className="text-gray-700 dark:text-gray-300">{caseData.history_present_illness}</p>
            </CollapsibleSection>
          )}

          {caseData.past_medical_history && (
            <CollapsibleSection title="Past Medical History">
              <p className="text-gray-700 dark:text-gray-300">{caseData.past_medical_history}</p>
            </CollapsibleSection>
          )}

          {caseData.medications && (
            <CollapsibleSection title="Current Medications">
              <p className="text-gray-700 dark:text-gray-300">{caseData.medications}</p>
            </CollapsibleSection>
          )}

          {caseData.allergies && (
            <CollapsibleSection title="Allergies">
              <p className="text-gray-700 dark:text-gray-300">{caseData.allergies}</p>
            </CollapsibleSection>
          )}

          {caseData.vital_signs && (
            <CollapsibleSection title="Vital Signs">
              <p className="text-gray-700 dark:text-gray-300">{caseData.vital_signs}</p>
            </CollapsibleSection>
          )}

          {caseData.physical_examination && (
            <CollapsibleSection title="Physical Examination">
              <p className="text-gray-700 dark:text-gray-300">{caseData.physical_examination}</p>
            </CollapsibleSection>
          )}

          {caseData.laboratory_results && (
            <CollapsibleSection title="Laboratory Results">
              <p className="text-gray-700 dark:text-gray-300">{caseData.laboratory_results}</p>
            </CollapsibleSection>
          )}

          {caseData.imaging_results && (
            <CollapsibleSection title="Imaging Results">
              <p className="text-gray-700 dark:text-gray-300">{caseData.imaging_results}</p>
            </CollapsibleSection>
          )}
        </div>

        {/* Files */}
        {caseData.files && caseData.files.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Attached Files
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caseData.files.map((file, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Icons.Upload />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{file.filename}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AI Analysis Results */}
        {caseData.analysis_result && (
          <div className="mt-6 space-y-6">
            <Card className="p-6 soap-card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                📋 SOAP Notes
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
{caseData.analysis_result.soap_notes || 'No SOAP notes available'}
                </pre>
              </div>
            </Card>

            <Card className="p-6 diagnosis-card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                🔍 Differential Diagnoses
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
{caseData.analysis_result.differential_diagnoses || 'No differential diagnoses available'}
                </pre>
              </div>
            </Card>

            <Card className="p-6 recommendation-card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                💊 Treatment Recommendations
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
{caseData.analysis_result.treatment_recommendations || 'No treatment recommendations available'}
                </pre>
              </div>
            </Card>

            {/* AI File Interpretations */}
            {caseData.analysis_result.file_interpretations && caseData.analysis_result.file_interpretations.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  🤖 AI File Interpretations
                </h2>
                <div className="space-y-4">
                  {caseData.analysis_result.file_interpretations.map((interpretation, index) => (
                    <CollapsibleSection 
                      key={index} 
                      title={`📄 ${interpretation.file_name}`}
                      defaultOpen
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🔍 Key Findings</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{interpretation.key_findings}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📊 File Type</h4>
                            <Badge variant="secondary">{interpretation.file_type}</Badge>
                          </div>
                        </div>
                        
                        {interpretation.abnormal_values !== 'None detected' && (
                          <div>
                            <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">⚠️ Abnormal Values</h4>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-red-600 dark:text-red-400 text-sm">{interpretation.abnormal_values}</p>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">🏥 Clinical Significance</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{interpretation.clinical_significance}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">💡 Recommendations</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{interpretation.recommendations}</p>
                        </div>
                        
                        {interpretation.full_interpretation && (
                          <CollapsibleSection title="📋 Full AI Interpretation" className="mt-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 dark:text-gray-300">
{interpretation.full_interpretation}
                              </pre>
                            </div>
                          </CollapsibleSection>
                        )}
                      </div>
                    </CollapsibleSection>
                  ))}
                </div>
              </Card>
            )}

            {/* Confidence Score */}
            {caseData.analysis_result.confidence_score && (
              <Card className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  🎯 AI Confidence Score
                </h2>
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {caseData.analysis_result.confidence_score}%
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all"
                    style={{ width: `${caseData.analysis_result.confidence_score}%` }}
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Overall confidence in the AI analysis based on available data
                </p>
              </Card>
            )}

            {/* Feedback Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                📝 Provide Feedback on AI Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                How helpful was this AI analysis? Your feedback helps improve our AI system.
              </p>
              <div className="space-y-4">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional comments about the analysis quality, accuracy, and usefulness..."
                  className="textarea w-full"
                  rows="3"
                />
                <div className="flex space-x-4">
                  <Button
                    variant="success"
                    onClick={() => handleFeedback(true)}
                  >
                    <Icons.ThumbsUp />
                    Helpful Analysis
                  </Button>
                  <Button
                    variant="error"
                    onClick={() => handleFeedback(false)}
                  >
                    <Icons.ThumbsDown />
                    Needs Improvement
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};