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

// Collapsible Component
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="collapsible-section">
      <button 
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className={`collapsible-icon ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'));
  
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState(null);
  
  // Authentication state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    full_name: '' 
  });
  
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

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Load cases and feedback stats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCases();
      loadFeedbackStats();
      if (currentView === 'login' || currentView === 'register') {
        setCurrentView('home');
      }
    }
  }, [isAuthenticated]);

  // Update patient summary when speech transcript changes
  useEffect(() => {
    if (transcript && currentView === 'new-case') {
      setPatientSummary(prev => prev + ' ' + transcript);
      resetTranscript();
    }
  }, [transcript, currentView, resetTranscript]);

  const checkAuthentication = async () => {
    if (!sessionToken) {
      setCurrentView('login');
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/verify?session_token=${sessionToken}`);
      if (response.data.valid) {
        setIsAuthenticated(true);
        setCurrentUser(response.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      logout();
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      const { session_token, user } = response.data;
      
      setSessionToken(session_token);
      localStorage.setItem('sessionToken', session_token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoginData({ username: '', password: '' });
      
    } catch (error) {
      console.error('Login failed:', error);
      alert(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, registerData);
      alert('Registration successful! Please login.');
      setCurrentView('login');
      setRegisterData({ username: '', email: '', password: '', full_name: '' });
      
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(`${API}/auth/logout?session_token=${sessionToken}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setCurrentView('login');
    }
  };

  const loadCases = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API}/cases?doctor_id=${currentUser.id}`);
      setCases(response.data);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadFeedbackStats = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API}/feedback/stats?doctor_id=${currentUser.id}`);
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
        doctor_id: currentUser.id
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
      setAnalysisResult({...analysisResponse.data, case_id: caseId});
      
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
        doctor_id: currentUser.id,
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

  const exportToPDF = async (caseId) => {
    try {
      const response = await axios.get(`${API}/cases/${caseId}/export-pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `case_${caseId.substring(0, 8)}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF');
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
        doctor_id: currentUser.id
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
        doctor_id: currentUser.id,
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

  const renderLogin = () => (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login to Clinical Insight Assistant</h2>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={loginData.username}
            onChange={(e) => setLoginData({...loginData, username: e.target.value})}
            placeholder="Enter your username"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            placeholder="Enter your password"
          />
        </div>
        <button 
          className="auth-button"
          onClick={login}
          disabled={loading || !loginData.username || !loginData.password}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p className="auth-switch">
          Don't have an account? 
          <button onClick={() => setCurrentView('register')}>Register</button>
        </p>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Register for Clinical Insight Assistant</h2>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={registerData.full_name}
            onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
            placeholder="Enter your full name"
          />
        </div>
        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={registerData.username}
            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
            placeholder="Choose a username"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={registerData.email}
            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={registerData.password}
            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
            placeholder="Choose a password"
          />
        </div>
        <button 
          className="auth-button"
          onClick={register}
          disabled={loading || !registerData.username || !registerData.password || !registerData.email || !registerData.full_name}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className="auth-switch">
          Already have an account? 
          <button onClick={() => setCurrentView('login')}>Login</button>
        </p>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome, Dr. {currentUser?.full_name || currentUser?.username}
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
            <div className="action-buttons">
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
              <button 
                className="export-button"
                onClick={() => exportToPDF(analysisResult.case_id)}
                title="Export to PDF"
              >
                📄 Export PDF
              </button>
            </div>
          </div>
          
          <CollapsibleSection title="Confidence Score" defaultOpen={true}>
            <div className="confidence-score">
              <h4>Confidence Score: {analysisResult.confidence_score}%</h4>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{width: `${analysisResult.confidence_score}%`}}
                />
              </div>
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="SOAP Notes" defaultOpen={true}>
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
          </CollapsibleSection>
          
          <CollapsibleSection title="Differential Diagnoses" defaultOpen={true}>
            {analysisResult.differential_diagnoses.map((diagnosis, index) => (
              <div key={index} className="diagnosis-item">
                <div className="diagnosis-header">
                  <span className="diagnosis-name">{diagnosis.diagnosis}</span>
                  <span className="diagnosis-likelihood">{diagnosis.likelihood}%</span>
                </div>
                <p className="diagnosis-rationale">{diagnosis.rationale}</p>
              </div>
            ))}
          </CollapsibleSection>
          
          <CollapsibleSection title="Recommendations & Investigations">
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
          </CollapsibleSection>

          {analysisResult.file_interpretations && analysisResult.file_interpretations.length > 0 && (
            <CollapsibleSection title="Individual File Interpretations">
              {analysisResult.file_interpretations.map((interpretation, index) => (
                <div key={index} className="file-interpretation">
                  <h5>📁 {interpretation.file_name}</h5>
                  <div className="interpretation-details">
                    <p><strong>Type:</strong> {interpretation.file_type}</p>
                    {interpretation.key_findings && interpretation.key_findings.length > 0 && (
                      <p><strong>Key Findings:</strong> {interpretation.key_findings.join(', ')}</p>
                    )}
                    {interpretation.abnormal_values && interpretation.abnormal_values.length > 0 && (
                      <p><strong>Abnormal Values:</strong> {interpretation.abnormal_values.join(', ')}</p>
                    )}
                    <p><strong>Clinical Significance:</strong> {interpretation.clinical_significance}</p>
                    {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                      <p><strong>Recommendations:</strong> {interpretation.recommendations.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          )}
          
          <CollapsibleSection title="Overall Assessment">
            <div className="overall-assessment">
              <p>{analysisResult.overall_assessment}</p>
            </div>
          </CollapsibleSection>
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
              <div className="case-actions">
                <button 
                  className="view-button"
                  onClick={() => viewCase(case_item.id)}
                >
                  View Details
                </button>
                {case_item.analysis_result && (
                  <button 
                    className="export-button-small"
                    onClick={() => exportToPDF(case_item.id)}
                    title="Export to PDF"
                  >
                    📄
                  </button>
                )}
              </div>
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
        <div className="header-actions">
          {selectedCase?.analysis_result && (
            <button 
              className="export-button"
              onClick={() => exportToPDF(selectedCase.id)}
              title="Export to PDF"
            >
              📄 Export PDF
            </button>
          )}
          <button 
            className="back-button"
            onClick={() => setCurrentView('cases')}
          >
            ← Back to Cases
          </button>
        </div>
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
              
              <CollapsibleSection title="Confidence Score" defaultOpen={true}>
                <div className="confidence-score">
                  <h4>Confidence Score: {selectedCase.confidence_score}%</h4>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{width: `${selectedCase.confidence_score}%`}}
                    />
                  </div>
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection title="SOAP Notes" defaultOpen={true}>
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
              </CollapsibleSection>

              {selectedCase.analysis_result.file_interpretations && selectedCase.analysis_result.file_interpretations.length > 0 && (
                <CollapsibleSection title="Individual File Interpretations">
                  {selectedCase.analysis_result.file_interpretations.map((interpretation, index) => (
                    <div key={index} className="file-interpretation">
                      <h5>📁 {interpretation.file_name}</h5>
                      <div className="interpretation-details">
                        <p><strong>Type:</strong> {interpretation.file_type}</p>
                        {interpretation.key_findings && interpretation.key_findings.length > 0 && (
                          <p><strong>Key Findings:</strong> {interpretation.key_findings.join(', ')}</p>
                        )}
                        {interpretation.abnormal_values && interpretation.abnormal_values.length > 0 && (
                          <p><strong>Abnormal Values:</strong> {interpretation.abnormal_values.join(', ')}</p>
                        )}
                        <p><strong>Clinical Significance:</strong> {interpretation.clinical_significance}</p>
                        {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                          <p><strong>Recommendations:</strong> {interpretation.recommendations.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CollapsibleSection>
              )}
              
              <CollapsibleSection title="Overall Assessment">
                <div className="overall-assessment">
                  <p>{selectedCase.analysis_result.overall_assessment}</p>
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="app">
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
      </div>
    );
  }

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
          <div className="user-menu">
            <span>Dr. {currentUser?.full_name || currentUser?.username}</span>
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>
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