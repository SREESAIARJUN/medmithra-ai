import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Speech Recognition Hook
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  };
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState(null);
  
  // New case form state
  const [patientSummary, setPatientSummary] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Query state
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  
  // Search filters state
  const [searchFilters, setSearchFilters] = useState({
    date_from: '',
    date_to: '',
    confidence_min: '',
    has_files: '',
    search_text: ''
  });
  const [searchResults, setSearchResults] = useState(null);

  // Speech recognition
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  } = useSpeechRecognition();

  // Load cases and feedback stats on component mount
  useEffect(() => {
    loadCases();
    loadFeedbackStats();
  }, []);

  // Update patient summary when speech transcript changes
  useEffect(() => {
    if (transcript && currentView === 'new-case') {
      setPatientSummary(prev => prev + ' ' + transcript);
      resetTranscript();
    }
  }, [transcript, currentView, resetTranscript]);

  const loadCases = async () => {
    try {
      const response = await axios.get(`${API}/cases`);
      setCases(response.data);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadFeedbackStats = async () => {
    try {
      const response = await axios.get(`${API}/feedback/stats`);
      setFeedbackStats(response.data);
    } catch (error) {
      console.error('Error loading feedback stats:', error);
    }
  };

  const createCase = async () => {
    if (!patientSummary.trim()) {
      alert('Please enter a patient summary');
      return;
    }

    setLoading(true);
    try {
      // Create case
      const caseResponse = await axios.post(`${API}/cases`, {
        patient_summary: patientSummary,
        doctor_id: 'default_doctor'
      });
      
      const caseId = caseResponse.data.id;
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        await axios.post(`${API}/cases/${caseId}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Analyze case
      const analysisResponse = await axios.post(`${API}/cases/${caseId}/analyze`);
      setAnalysisResult(analysisResponse.data);
      
      // Reset form
      setPatientSummary('');
      setSelectedFiles([]);
      
      // Reload cases
      loadCases();
      
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Error creating case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (caseId, feedbackType, feedbackText = '') => {
    try {
      await axios.post(`${API}/cases/${caseId}/feedback`, {
        case_id: caseId,
        doctor_id: 'default_doctor',
        feedback_type: feedbackType,
        feedback_text: feedbackText
      });
      
      // Reload feedback stats
      loadFeedbackStats();
      alert('Feedback submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/query`, {
        query: query,
        doctor_id: 'default_doctor'
      });
      setQueryResult(response.data);
    } catch (error) {
      console.error('Error processing query:', error);
      alert('Error processing query');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setLoading(true);
    try {
      const filters = {
        doctor_id: 'default_doctor',
        ...searchFilters
      };
      
      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
          delete filters[key];
        }
      });
      
      const response = await axios.post(`${API}/cases/search`, filters);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error in advanced search:', error);
      alert('Error in advanced search');
    } finally {
      setLoading(false);
    }
  };

  const viewCase = async (caseId) => {
    try {
      const response = await axios.get(`${API}/cases/${caseId}`);
      setSelectedCase(response.data);
      setCurrentView('case-detail');
    } catch (error) {
      console.error('Error loading case:', error);
    }
  };

  const renderHome = () => (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Clinical Insight Assistant
          </h1>
          <p className="hero-subtitle">
            AI-powered multimodal analysis for comprehensive patient care
          </p>
          <div className="hero-buttons">
            <button 
              className="primary-button"
              onClick={() => setCurrentView('new-case')}
            >
              New Case Analysis
            </button>
            <button 
              className="secondary-button"
              onClick={() => setCurrentView('cases')}
            >
              View Cases
            </button>
          </div>
        </div>
      </div>
      
      {feedbackStats && (
        <div className="stats-section">
          <h2 className="section-title">Performance Dashboard</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{feedbackStats.total_feedback}</div>
              <div className="stat-label">Total Feedback</div>
            </div>
            <div className="stat-card positive">
              <div className="stat-number">{feedbackStats.positive_feedback}</div>
              <div className="stat-label">Positive Reviews</div>
            </div>
            <div className="stat-card negative">
              <div className="stat-number">{feedbackStats.negative_feedback}</div>
              <div className="stat-label">Negative Reviews</div>
            </div>
            <div className="stat-card satisfaction">
              <div className="stat-number">{feedbackStats.satisfaction_rate}%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>SOAP Notes</h3>
            <p>Automatically generate structured clinical documentation</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔬</div>
            <h3>Lab Analysis</h3>
            <p>Interpret lab reports and medical data with AI precision</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Medical Imaging</h3>
            <p>Analyze X-rays, CT scans, and other medical images</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI Diagnosis</h3>
            <p>Get differential diagnoses with confidence scores</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>Voice Dictation</h3>
            <p>Use speech-to-text for hands-free case entry</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Feedback Analytics</h3>
            <p>Track AI performance and improve over time</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNewCase = () => (
    <div className="new-case-container">
      <div className="form-header">
        <h2>New Case Analysis</h2>
        <button 
          className="back-button"
          onClick={() => setCurrentView('home')}
        >
          ← Back
        </button>
      </div>
      
      <div className="case-form">
        <div className="form-group">
          <label>Patient Case Summary</label>
          <div className="textarea-container">
            <textarea
              value={patientSummary}
              onChange={(e) => setPatientSummary(e.target.value)}
              placeholder="Enter patient history, symptoms, and clinical observations..."
              rows="6"
            />
            {hasRecognitionSupport && (
              <div className="speech-controls">
                <button
                  type="button"
                  className={`speech-button ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Stop dictation' : 'Start dictation'}
                >
                  🎤 {isListening ? 'Stop' : 'Dictate'}
                </button>
                {isListening && <span className="listening-indicator">Listening...</span>}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>Upload Medical Files</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.csv,.jpg,.jpeg,.png,.dcm"
          />
          <p className="file-info">
            Supported: Lab reports (CSV, PDF), Medical images (JPG, PNG, DICOM)
          </p>
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files:</h4>
              {selectedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          className="analyze-button"
          onClick={createCase}
          disabled={loading || !patientSummary.trim()}
        >
          {loading ? 'Analyzing...' : 'Analyze Case'}
        </button>
      </div>
      
      {analysisResult && (
        <div className="analysis-results">
          <div className="analysis-header">
            <h3>Clinical Analysis Results</h3>
            <div className="feedback-buttons">
              <button 
                className="feedback-positive"
                onClick={() => submitFeedback(analysisResult.case_id, 'positive')}
                title="Good analysis"
              >
                👍 Good
              </button>
              <button 
                className="feedback-negative"
                onClick={() => submitFeedback(analysisResult.case_id, 'negative')}
                title="Poor analysis"
              >
                👎 Poor
              </button>
            </div>
          </div>
          
          <div className="confidence-score">
            <h4>Confidence Score: {analysisResult.confidence_score}%</h4>
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{width: `${analysisResult.confidence_score}%`}}
              />
            </div>
          </div>
          
          <div className="soap-notes">
            <h4>SOAP Notes</h4>
            <div className="soap-grid">
              <div className="soap-item">
                <h5>Subjective</h5>
                <p>{analysisResult.soap_note.subjective}</p>
              </div>
              <div className="soap-item">
                <h5>Objective</h5>
                <p>{analysisResult.soap_note.objective}</p>
              </div>
              <div className="soap-item">
                <h5>Assessment</h5>
                <p>{analysisResult.soap_note.assessment}</p>
              </div>
              <div className="soap-item">
                <h5>Plan</h5>
                <p>{analysisResult.soap_note.plan}</p>
              </div>
            </div>
          </div>
          
          <div className="diagnoses">
            <h4>Differential Diagnoses</h4>
            {analysisResult.differential_diagnoses.map((diagnosis, index) => (
              <div key={index} className="diagnosis-item">
                <div className="diagnosis-header">
                  <span className="diagnosis-name">{diagnosis.diagnosis}</span>
                  <span className="diagnosis-likelihood">{diagnosis.likelihood}%</span>
                </div>
                <p className="diagnosis-rationale">{diagnosis.rationale}</p>
              </div>
            ))}
          </div>
          
          <div className="recommendations">
            <div className="recommendation-section">
              <h4>Treatment Recommendations</h4>
              <ul>
                {analysisResult.treatment_recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="recommendation-section">
              <h4>Investigation Suggestions</h4>
              <ul>
                {analysisResult.investigation_suggestions.map((inv, index) => (
                  <li key={index}>{inv}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="overall-assessment">
            <h4>Overall Assessment</h4>
            <p>{analysisResult.overall_assessment}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderCases = () => (
    <div className="cases-container">
      <div className="cases-header">
        <h2>Patient Cases</h2>
        <button 
          className="back-button"
          onClick={() => setCurrentView('home')}
        >
          ← Back
        </button>
      </div>
      
      <div className="query-section">
        <div className="query-input">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about cases (e.g., 'Show yesterday's CBC results')"
          />
          <button onClick={handleQuery} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {queryResult && (
          <div className="query-result">
            <h4>Search Results:</h4>
            <p>{queryResult.response}</p>
          </div>
        )}
      </div>
      
      <div className="advanced-search">
        <h3>Advanced Search & Filters</h3>
        <div className="search-form">
          <div className="search-row">
            <div className="search-field">
              <label>From Date</label>
              <input
                type="date"
                value={searchFilters.date_from}
                onChange={(e) => setSearchFilters({...searchFilters, date_from: e.target.value})}
              />
            </div>
            <div className="search-field">
              <label>To Date</label>
              <input
                type="date"
                value={searchFilters.date_to}
                onChange={(e) => setSearchFilters({...searchFilters, date_to: e.target.value})}
              />
            </div>
            <div className="search-field">
              <label>Min Confidence</label>
              <input
                type="number"
                min="0"
                max="100"
                value={searchFilters.confidence_min}
                onChange={(e) => setSearchFilters({...searchFilters, confidence_min: e.target.value})}
                placeholder="0-100"
              />
            </div>
          </div>
          <div className="search-row">
            <div className="search-field">
              <label>Has Files</label>
              <select
                value={searchFilters.has_files}
                onChange={(e) => setSearchFilters({...searchFilters, has_files: e.target.value})}
              >
                <option value="">Any</option>
                <option value="true">With Files</option>
                <option value="false">Without Files</option>
              </select>
            </div>
            <div className="search-field">
              <label>Search Text</label>
              <input
                type="text"
                value={searchFilters.search_text}
                onChange={(e) => setSearchFilters({...searchFilters, search_text: e.target.value})}
                placeholder="Search in case summary..."
              />
            </div>
            <div className="search-field">
              <button 
                className="search-button"
                onClick={handleAdvancedSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
        
        {searchResults && (
          <div className="search-results">
            <h4>Found {searchResults.total_found} cases</h4>
          </div>
        )}
      </div>
      
      <div className="cases-grid">
        {(searchResults ? searchResults.cases : cases).map((case_item) => (
          <div key={case_item.id} className="case-card">
            <div className="case-header">
              <h4>Case {case_item.id.substring(0, 8)}</h4>
              <span className="case-date">
                {new Date(case_item.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="case-summary">
              {case_item.patient_summary.substring(0, 100)}...
            </p>
            <div className="case-footer">
              <span className="files-count">
                {case_item.uploaded_files.length} files
              </span>
              {case_item.confidence_score && (
                <span className="confidence">
                  {case_item.confidence_score}% confidence
                </span>
              )}
              <button 
                className="view-button"
                onClick={() => viewCase(case_item.id)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCaseDetail = () => (
    <div className="case-detail-container">
      <div className="case-detail-header">
        <h2>Case Details</h2>
        <button 
          className="back-button"
          onClick={() => setCurrentView('cases')}
        >
          ← Back to Cases
        </button>
      </div>
      
      {selectedCase && (
        <div className="case-detail">
          <div className="case-info">
            <h3>Patient Summary</h3>
            <p>{selectedCase.patient_summary}</p>
            
            <div className="case-meta">
              <span>Created: {new Date(selectedCase.created_at).toLocaleString()}</span>
              <span>Files: {selectedCase.uploaded_files.length}</span>
            </div>
          </div>
          
          {selectedCase.analysis_result && (
            <div className="analysis-results">
              <div className="analysis-header">
                <h3>Analysis Results</h3>
                <div className="feedback-buttons">
                  <button 
                    className="feedback-positive"
                    onClick={() => submitFeedback(selectedCase.id, 'positive')}
                    title="Good analysis"
                  >
                    👍 Good
                  </button>
                  <button 
                    className="feedback-negative"
                    onClick={() => submitFeedback(selectedCase.id, 'negative')}
                    title="Poor analysis"
                  >
                    👎 Poor
                  </button>
                </div>
              </div>
              
              <div className="confidence-score">
                <h4>Confidence Score: {selectedCase.confidence_score}%</h4>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill"
                    style={{width: `${selectedCase.confidence_score}%`}}
                  />
                </div>
              </div>
              
              <div className="soap-notes">
                <h4>SOAP Notes</h4>
                <div className="soap-grid">
                  <div className="soap-item">
                    <h5>Subjective</h5>
                    <p>{selectedCase.analysis_result.soap_note.subjective}</p>
                  </div>
                  <div className="soap-item">
                    <h5>Objective</h5>
                    <p>{selectedCase.analysis_result.soap_note.objective}</p>
                  </div>
                  <div className="soap-item">
                    <h5>Assessment</h5>
                    <p>{selectedCase.analysis_result.soap_note.assessment}</p>
                  </div>
                  <div className="soap-item">
                    <h5>Plan</h5>
                    <p>{selectedCase.analysis_result.soap_note.plan}</p>
                  </div>
                </div>
              </div>
              
              <div className="overall-assessment">
                <h4>Overall Assessment</h4>
                <p>{selectedCase.analysis_result.overall_assessment}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Clinical Insight Assistant</h1>
        </div>
        <div className="nav-links">
          <button 
            className={currentView === 'home' ? 'active' : ''}
            onClick={() => setCurrentView('home')}
          >
            Home
          </button>
          <button 
            className={currentView === 'new-case' ? 'active' : ''}
            onClick={() => setCurrentView('new-case')}
          >
            New Case
          </button>
          <button 
            className={currentView === 'cases' ? 'active' : ''}
            onClick={() => setCurrentView('cases')}
          >
            Cases
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'home' && renderHome()}
        {currentView === 'new-case' && renderNewCase()}
        {currentView === 'cases' && renderCases()}
        {currentView === 'case-detail' && renderCaseDetail()}
      </main>
    </div>
  );
};

export default App;