import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Textarea, LoadingSpinner, Icons, Badge, CollapsibleSection } from './UIComponents';
import { SpeechToText } from './VoiceComponents';

export const MultimodalCaseEntry = ({ onNavigate }) => {
  const { apiUrl, getAuthHeaders } = useAuth();
  const [caseText, setCaseText] = useState('');
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [fileInterpretations, setFileInterpretations] = useState([]);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  const handleSpeechTranscript = (transcript) => {
    setCaseText(prev => prev + (prev ? ' ' : '') + transcript);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    
    // Reset upload progress for new files
    const progress = {};
    selectedFiles.forEach((file, index) => {
      progress[index] = 0;
    });
    setUploadProgress(progress);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    const newProgress = { ...uploadProgress };
    delete newProgress[index];
    setUploadProgress(newProgress);
  };

  const getFileTypeIcon = (file) => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('csv') || type.includes('excel')) return '📊';
    return '📁';
  };

  const getFileTypeDescription = (file) => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return 'Medical Image';
    if (type.includes('pdf')) return 'PDF Document';
    if (type.includes('csv') || type.includes('excel')) return 'Lab Report';
    return 'Document';
  };

  const analyzeCase = async () => {
    if (!caseText.trim() && files.length === 0) {
      setError('Please enter case text or upload files to analyze');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysis(null);
    setFileInterpretations([]);

    try {
      // First create the case
      const caseResponse = await fetch(`${apiUrl}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          patient_id: `TEMP_${Date.now()}`,
          patient_name: 'Quick Analysis',
          patient_age: 0,
          patient_gender: 'Not specified',
          chief_complaint: caseText || 'File analysis',
          history_present_illness: caseText,
        }),
      });

      if (!caseResponse.ok) {
        throw new Error('Failed to create case for analysis');
      }

      const caseData = await caseResponse.json();
      const caseId = caseData.id;

      // Upload files if any
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);

          setUploadProgress(prev => ({ ...prev, [i]: 50 }));

          const uploadResponse = await fetch(`${apiUrl}/api/cases/${caseId}/upload`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            setUploadProgress(prev => ({ ...prev, [i]: 100 }));
          } else {
            console.error(`Failed to upload ${file.name}`);
          }
        }
      }

      // Analyze the case
      const analysisResponse = await fetch(`${apiUrl}/api/cases/${caseId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!analysisResponse.ok) {
        throw new Error('Analysis failed');
      }

      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData.analysis_result);
      
      // Set file interpretations if available
      if (analysisData.analysis_result?.file_interpretations) {
        setFileInterpretations(analysisData.analysis_result.file_interpretations);
      }

    } catch (error) {
      setError(error.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearAll = () => {
    setCaseText('');
    setFiles([]);
    setAnalysis(null);
    setFileInterpretations([]);
    setError('');
    setUploadProgress({});
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
            🩺 Multimodal Clinical Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter case details by typing or dictation, upload lab reports and medical images for AI-powered insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Case Text Entry */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  📝 Case Summary
                </h2>
                <SpeechToText 
                  onTranscript={handleSpeechTranscript}
                  className="ml-4"
                />
              </div>
              
              <Textarea
                value={caseText}
                onChange={(e) => setCaseText(e.target.value)}
                placeholder="Enter patient case summary, symptoms, history, examination findings... 

Examples:
• 45-year-old male with chest pain and shortness of breath for 2 hours
• Patient presents with fever, cough, and fatigue lasting 5 days
• Elderly female with confusion and falls, recent medication changes

You can also use the microphone button above to dictate your notes."
                rows={8}
                className="w-full"
              />
              
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {caseText.length} characters • Speech-to-text enabled
              </div>
            </Card>

            {/* File Upload */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                📎 Upload Medical Files
              </h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.dcm"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Icons.Upload />
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Click to upload</span> or drag files here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Lab reports (CSV, PDF), Medical images (JPG, PNG), DICOM files
                    </p>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Selected Files ({files.length})
                    </h3>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getFileTypeIcon(file)}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {getFileTypeDescription(file)} • {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {uploadProgress[index] > 0 && uploadProgress[index] < 100 && (
                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress[index]}%` }}
                              />
                            </div>
                          )}
                          {uploadProgress[index] === 100 && (
                            <Badge variant="success" size="sm">Uploaded</Badge>
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                variant="primary"
                size="lg"
                onClick={analyzeCase}
                loading={analyzing}
                disabled={!caseText.trim() && files.length === 0}
                className="flex-1"
              >
                <Icons.Analysis />
                {analyzing ? 'Analyzing...' : 'AI Analysis'}
              </Button>
              <Button
                variant="secondary"
                onClick={clearAll}
                disabled={analyzing}
              >
                Clear All
              </Button>
            </div>

            {error && (
              <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analyzing && (
              <Card className="p-6 text-center">
                <LoadingSpinner size="xl" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
                  🤖 AI Analysis in Progress
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Processing case text and analyzing uploaded files...
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>⚕️</span>
                    <span>Generating SOAP notes</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>🔍</span>
                    <span>Analyzing differential diagnoses</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>📊</span>
                    <span>Interpreting uploaded files</span>
                  </div>
                </div>
              </Card>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Confidence Score */}
                {analysis.confidence_score && (
                  <Card className="p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Overall Confidence Score
                    </h3>
                    <div className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                      {analysis.confidence_score}%
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all"
                          style={{ width: `${analysis.confidence_score}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {/* SOAP Notes */}
                {analysis.soap_note && (
                  <CollapsibleSection title="📋 SOAP Notes" defaultOpen>
                    <div className="space-y-4">
                      {analysis.soap_note.subjective && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200">Subjective</h4>
                          <p className="text-blue-700 dark:text-blue-300 mt-1">{analysis.soap_note.subjective}</p>
                        </div>
                      )}
                      {analysis.soap_note.objective && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-semibold text-green-800 dark:text-green-200">Objective</h4>
                          <p className="text-green-700 dark:text-green-300 mt-1">{analysis.soap_note.objective}</p>
                        </div>
                      )}
                      {analysis.soap_note.assessment && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Assessment</h4>
                          <p className="text-yellow-700 dark:text-yellow-300 mt-1">{analysis.soap_note.assessment}</p>
                        </div>
                      )}
                      {analysis.soap_note.plan && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <h4 className="font-semibold text-purple-800 dark:text-purple-200">Plan</h4>
                          <p className="text-purple-700 dark:text-purple-300 mt-1">{analysis.soap_note.plan}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Differential Diagnoses */}
                {analysis.differential_diagnoses && analysis.differential_diagnoses.length > 0 && (
                  <CollapsibleSection title="🔍 Differential Diagnoses">
                    <div className="space-y-3">
                      {analysis.differential_diagnoses.map((diagnosis, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {diagnosis.diagnosis}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                                {diagnosis.rationale}
                              </p>
                            </div>
                            <Badge 
                              variant={diagnosis.likelihood > 70 ? 'success' : diagnosis.likelihood > 50 ? 'warning' : 'secondary'}
                            >
                              {diagnosis.likelihood}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Treatment Recommendations */}
                {analysis.treatment_recommendations && analysis.treatment_recommendations.length > 0 && (
                  <CollapsibleSection title="💊 Treatment Recommendations">
                    <ul className="space-y-2">
                      {analysis.treatment_recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-success-600 dark:text-success-400 mt-1">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}

                {/* Investigation Suggestions */}
                {analysis.investigation_suggestions && analysis.investigation_suggestions.length > 0 && (
                  <CollapsibleSection title="🧪 Investigation Suggestions">
                    <ul className="space-y-2">
                      {analysis.investigation_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}
              </div>
            )}

            {/* File Interpretations */}
            {fileInterpretations.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  📊 AI File Interpretations
                </h2>
                <div className="space-y-4">
                  {fileInterpretations.map((interpretation, index) => (
                    <CollapsibleSection 
                      key={index} 
                      title={`${getFileTypeIcon({ type: interpretation.file_type })} ${interpretation.file_name}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Key Findings</h4>
                          <p className="text-gray-700 dark:text-gray-300">{interpretation.key_findings}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Clinical Significance</h4>
                          <p className="text-gray-700 dark:text-gray-300">{interpretation.clinical_significance}</p>
                        </div>
                        {interpretation.abnormal_values !== 'None detected' && (
                          <div>
                            <h4 className="font-medium text-red-700 dark:text-red-400">Abnormal Values</h4>
                            <p className="text-red-600 dark:text-red-400">{interpretation.abnormal_values}</p>
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Recommendations</h4>
                          <p className="text-gray-700 dark:text-gray-300">{interpretation.recommendations}</p>
                        </div>
                      </div>
                    </CollapsibleSection>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};