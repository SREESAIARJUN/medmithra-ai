import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { 
  Button, 
  Card, 
  Input, 
  Textarea, 
  Badge, 
  ProgressBar, 
  LoadingSpinner, 
  ThemeToggle, 
  CollapsibleSection, 
  Icons 
} from './components/UIComponents';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Speech Recognition Hook
const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, []);

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      setIsListening(false);
      recognition.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  const hasRecognitionSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  };
};

// Main App Component
const AppContent = () => {
  const { isDark, toggleTheme } = useTheme();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'));
  
  // UI state
  const [currentView, setCurrentView] = useState('home');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Data state
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  
  // Auth forms state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    full_name: '' 
  });
  
  // New case form state
  const [patientSummary, setPatientSummary] = useState('');
  const [patientDetails, setPatientDetails] = useState({
    patient_id: '',
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    doctor_name: ''
  });
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
    setAuthLoading(true);
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

  // Clear errors when switching views
  useEffect(() => {
    setAuthError('');
  }, [currentView]);

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
      setAuthLoading(false);
      return;
    }

    try {
      setAuthLoading(true);
      setAuthError('');
      const response = await axios.get(`${API}/api/auth/verify?session_token=${sessionToken}`);
      if (response.data.valid) {
        setIsAuthenticated(true);
        setCurrentUser(response.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setAuthError('Authentication check failed. Please try logging in again.');
      logout();
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async () => {
    if (authLoading) return; // Prevent multiple simultaneous requests
    
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await axios.post(`${API}/api/auth/login`, loginData);
      const { session_token, user } = response.data;
      
      setSessionToken(session_token);
      localStorage.setItem('sessionToken', session_token);
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoginData({ username: '', password: '' });
      
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials and try again.';
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async () => {
    if (authLoading) return; // Prevent multiple simultaneous requests
    
    setAuthLoading(true);
    setAuthError('');
    try {
      await axios.post(`${API}/api/auth/register`, registerData);
      setCurrentView('login');
      setRegisterData({ username: '', email: '', password: '', full_name: '' });
      setAuthError('Registration successful! Please login with your credentials.');
      
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please check your information and try again.';
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(`${API}/api/auth/logout?session_token=${sessionToken}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAuthError('');
      setCurrentView('login');
    }
  };

  const loadCases = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API}/api/cases?doctor_id=${currentUser.id}`);
      setCases(response.data);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const loadFeedbackStats = async () => {
    if (!currentUser) return;
    try {
      const response = await axios.get(`${API}/api/feedback/stats?doctor_id=${currentUser.id}`);
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
      const caseResponse = await axios.post(`${API}/api/cases`, {
        patient_summary: patientSummary,
        doctor_id: currentUser.id,
        doctor_name: currentUser.full_name || currentUser.username,
        ...patientDetails,
        patient_age: patientDetails.patient_age ? parseInt(patientDetails.patient_age) : null
      });
      
      const caseId = caseResponse.data.id;
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        await axios.post(`${API}/api/cases/${caseId}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Analyze case
      const analysisResponse = await axios.post(`${API}/api/cases/${caseId}/analyze`);
      setAnalysisResult({...analysisResponse.data, case_id: caseId});
      
      // Reset form
      setPatientSummary('');
      setPatientDetails({
        patient_id: '',
        patient_name: '',
        patient_age: '',
        patient_gender: '',
        doctor_name: ''
      });
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
      await axios.post(`${API}/api/cases/${caseId}/feedback`, {
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
      const response = await axios.get(`${API}/api/cases/${caseId}/export-pdf`, {
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
      const response = await axios.post(`${API}/api/query`, {
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
      
      const response = await axios.post(`${API}/api/cases/search`, filters);
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
      const response = await axios.get(`${API}/api/cases/${caseId}`);
      setSelectedCase(response.data);
      setCurrentView('case-detail');
    } catch (error) {
      console.error('Error loading case:', error);
    }
  };

  const renderLoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full">
            <Icons.Medical />
          </div>
        </div>
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Clinical Insight Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Loading your medical dashboard...
        </p>
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 animate-fade-in">
      <Card className="w-full max-w-md p-8 m-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full">
              <Icons.Medical />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Clinical Insight Assistant
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your medical dashboard
          </p>
        </div>
        
        {/* Error Message Display */}
        {authError && (
          <div className={`mb-6 p-4 rounded-lg border ${
            authError.includes('successful') 
              ? 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300'
              : 'bg-error-50 border-error-200 text-error-800 dark:bg-error-900/20 dark:border-error-800 dark:text-error-300'
          }`}>
            <div className="flex items-center">
              <span className="text-sm font-medium">{authError}</span>
              <button 
                onClick={() => setAuthError('')}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <Input
            label="Username"
            type="text"
            value={loginData.username}
            onChange={(e) => setLoginData({...loginData, username: e.target.value})}
            placeholder="Enter your username"
            disabled={authLoading}
          />
          
          <Input
            label="Password"
            type="password"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            placeholder="Enter your password"
            disabled={authLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && loginData.username && loginData.password && !authLoading) {
                login();
              }
            }}
          />
          
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={login}
            loading={authLoading}
            disabled={!loginData.username || !loginData.password || authLoading}
          >
            {authLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button 
                onClick={() => {
                  setCurrentView('register');
                  setAuthError('');
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium transition-colors"
                disabled={authLoading}
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 animate-fade-in">
      <Card className="w-full max-w-md p-8 m-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-medical-500 to-medical-600 rounded-full">
              <Icons.Medical />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Join our medical platform
          </p>
        </div>
        
        {/* Error Message Display */}
        {authError && (
          <div className={`mb-6 p-4 rounded-lg border ${
            authError.includes('successful') 
              ? 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300'
              : 'bg-error-50 border-error-200 text-error-800 dark:bg-error-900/20 dark:border-error-800 dark:text-error-300'
          }`}>
            <div className="flex items-center">
              <span className="text-sm font-medium">{authError}</span>
              <button 
                onClick={() => setAuthError('')}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <Input
            label="Full Name"
            type="text"
            value={registerData.full_name}
            onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
            placeholder="Enter your full name"
            disabled={authLoading}
          />
          
          <Input
            label="Username"
            type="text"
            value={registerData.username}
            onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
            placeholder="Choose a username"
            disabled={authLoading}
          />
          
          <Input
            label="Email"
            type="email"
            value={registerData.email}
            onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
            placeholder="Enter your email"
            disabled={authLoading}
          />
          
          <Input
            label="Password"
            type="password"
            value={registerData.password}
            onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
            placeholder="Choose a password"
            disabled={authLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && registerData.username && registerData.password && registerData.email && registerData.full_name && !authLoading) {
                register();
              }
            }}
          />
          
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={register}
            loading={authLoading}
            disabled={!registerData.username || !registerData.password || !registerData.email || !registerData.full_name || authLoading}
          >
            {authLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button 
                onClick={() => {
                  setCurrentView('login');
                  setAuthError('');
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium transition-colors"
                disabled={authLoading}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderHome = () => (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="hero-gradient rounded-2xl p-8 md:p-12 text-white mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
            Welcome, Dr. {currentUser?.full_name || currentUser?.username}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-slide-up" style={{animationDelay: '0.1s'}}>
            AI-powered multimodal analysis for comprehensive patient care
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setCurrentView('new-case')}
              icon={<Icons.Plus />}
              className="bg-white/10 hover:bg-white/20 border-white/20"
            >
              New Case Analysis
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => setCurrentView('cases')}
              icon={<Icons.Cases />}
              className="bg-white/10 hover:bg-white/20 border-white/20"
            >
              View Cases
            </Button>
          </div>
        </div>
      </div>
      
      {/* Performance Dashboard */}
      {feedbackStats && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Performance Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="stat-card">
              <div className="stat-number text-primary-600">{feedbackStats.total_feedback}</div>
              <div className="stat-label">Total Feedback</div>
            </Card>
            <Card className="stat-card border-l-4 border-success-500">
              <div className="stat-number text-success-600">{feedbackStats.positive_feedback}</div>
              <div className="stat-label">Positive Reviews</div>
            </Card>
            <Card className="stat-card border-l-4 border-error-500">
              <div className="stat-number text-error-600">{feedbackStats.negative_feedback}</div>
              <div className="stat-label">Negative Reviews</div>
            </Card>
            <Card className="stat-card border-l-4 border-warning-500">
              <div className="stat-number text-warning-600">{feedbackStats.satisfaction_rate}%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Features Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📋', title: 'SOAP Notes', desc: 'Automatically generate structured clinical documentation' },
            { icon: '🔬', title: 'Lab Analysis', desc: 'Interpret lab reports and medical data with AI precision' },
            { icon: '🏥', title: 'Medical Imaging', desc: 'Analyze X-rays, CT scans, and other medical images' },
            { icon: '🧠', title: 'AI Diagnosis', desc: 'Get differential diagnoses with confidence scores' },
            { icon: '🎤', title: 'Voice Dictation', desc: 'Use speech-to-text for hands-free case entry' },
            { icon: '📊', title: 'Analytics', desc: 'Track AI performance and improve over time' }
          ].map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:scale-105 transition-transform duration-300" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNewCase = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          New Case Analysis
        </h2>
        <Button 
          variant="secondary"
          onClick={() => setCurrentView('home')}
          icon={<Icons.ArrowLeft />}
        >
          Back
        </Button>
      </div>
      
      <Card className="p-8 mb-8">
        <div className="space-y-6">
          {/* Patient Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Patient ID"
                value={patientDetails.patient_id}
                onChange={(e) => setPatientDetails({...patientDetails, patient_id: e.target.value})}
                placeholder="Patient ID"
              />
              <Input
                label="Patient Name"
                value={patientDetails.patient_name}
                onChange={(e) => setPatientDetails({...patientDetails, patient_name: e.target.value})}
                placeholder="Patient full name"
              />
              <Input
                label="Age"
                type="number"
                value={patientDetails.patient_age}
                onChange={(e) => setPatientDetails({...patientDetails, patient_age: e.target.value})}
                placeholder="Age"
              />
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  value={patientDetails.patient_gender}
                  onChange={(e) => setPatientDetails({...patientDetails, patient_gender: e.target.value})}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Doctor Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Doctor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Doctor Name"
                value={patientDetails.doctor_name || (currentUser?.full_name || currentUser?.username)}
                onChange={(e) => setPatientDetails({...patientDetails, doctor_name: e.target.value})}
                placeholder="Attending physician"
              />
              <Input
                label="Doctor ID"
                value={currentUser?.id || ''}
                disabled
                className="bg-gray-100 dark:bg-gray-700"
              />
            </div>
          </div>
          
          {/* Clinical Summary Section */}
          <div>
            <label className="form-label">Patient Case Summary</label>
            <div className="relative">
              <Textarea
                value={patientSummary}
                onChange={(e) => setPatientSummary(e.target.value)}
                placeholder="Enter patient history, symptoms, and clinical observations..."
                rows="6"
                className="pr-20"
              />
              {hasRecognitionSupport && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Button
                    variant={isListening ? 'error' : 'primary'}
                    size="sm"
                    onClick={isListening ? stopListening : startListening}
                    icon={<Icons.Microphone />}
                    className={isListening ? 'recording-pulse' : ''}
                  >
                    {isListening ? 'Stop' : 'Dictate'}
                  </Button>
                  {isListening && (
                    <Badge variant="error" className="animate-pulse">
                      Listening...
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="form-label">Upload Medical Files</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.csv,.jpg,.jpeg,.png,.dcm"
              className="input cursor-pointer"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported: Lab reports (CSV, PDF), Medical images (JPG, PNG, DICOM)
            </p>
            {selectedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Selected Files:</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                      <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="success"
            size="lg"
            className="w-full"
            onClick={createCase}
            loading={loading}
            disabled={!patientSummary.trim()}
            icon={<Icons.Analysis />}
          >
            {loading ? 'Analyzing...' : 'Analyze Case'}
          </Button>
        </div>
      </Card>
      
      {analysisResult && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Clinical Analysis Results</h3>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button 
                variant="success"
                size="sm"
                onClick={() => submitFeedback(analysisResult.case_id, 'positive')}
                icon={<Icons.ThumbsUp />}
              >
                Good
              </Button>
              <Button 
                variant="error"
                size="sm"
                onClick={() => submitFeedback(analysisResult.case_id, 'negative')}
                icon={<Icons.ThumbsDown />}
              >
                Poor
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => exportToPDF(analysisResult.case_id)}
                icon={<Icons.Download />}
              >
                Export PDF
              </Button>
            </div>
          </div>
          
          <CollapsibleSection title="Confidence Score" defaultOpen={true}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confidence Score: {analysisResult.confidence_score}%
                </h4>
                <Badge 
                  variant={analysisResult.confidence_score >= 80 ? 'success' : analysisResult.confidence_score >= 60 ? 'warning' : 'error'}
                  size="lg"
                >
                  {analysisResult.confidence_score >= 80 ? 'High' : analysisResult.confidence_score >= 60 ? 'Medium' : 'Low'} Confidence
                </Badge>
              </div>
              <ProgressBar 
                value={analysisResult.confidence_score} 
                color={analysisResult.confidence_score >= 80 ? 'success' : analysisResult.confidence_score >= 60 ? 'warning' : 'error'}
              />
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="SOAP Notes" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysisResult.soap_note).map(([key, value]) => (
                <div key={key} className="soap-card">
                  <h5 className="font-semibold text-gray-900 dark:text-white capitalize mb-2">{key}</h5>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Differential Diagnoses" defaultOpen={true}>
            <div className="space-y-4">
              {analysisResult.differential_diagnoses.map((diagnosis, index) => (
                <div key={index} className="diagnosis-card">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-900 dark:text-white">{diagnosis.diagnosis}</h5>
                    <Badge variant="warning" size="lg">{diagnosis.likelihood}%</Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{diagnosis.rationale}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Recommendations & Investigations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="recommendation-card">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Treatment Recommendations</h4>
                <ul className="space-y-2">
                  {analysisResult.treatment_recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-success-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="recommendation-card">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Investigation Suggestions</h4>
                <ul className="space-y-2">
                  {analysisResult.investigation_suggestions.map((inv, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-medical-500 mt-1">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {analysisResult.file_interpretations && analysisResult.file_interpretations.length > 0 && (
            <CollapsibleSection title="Individual File Interpretations">
              <div className="space-y-4">
                {analysisResult.file_interpretations.map((interpretation, index) => (
                  <div key={index} className="medical-card">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📁</span>
                      <h5 className="font-semibold text-gray-900 dark:text-white">{interpretation.file_name}</h5>
                      <Badge variant="secondary">{interpretation.file_type}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {interpretation.key_findings && interpretation.key_findings.length > 0 && (
                        <p><strong className="text-gray-900 dark:text-white">Key Findings:</strong> <span className="text-gray-700 dark:text-gray-300">{interpretation.key_findings.join(', ')}</span></p>
                      )}
                      {interpretation.abnormal_values && interpretation.abnormal_values.length > 0 && (
                        <p><strong className="text-gray-900 dark:text-white">Abnormal Values:</strong> <span className="text-error-600">{interpretation.abnormal_values.join(', ')}</span></p>
                      )}
                      <p><strong className="text-gray-900 dark:text-white">Clinical Significance:</strong> <span className="text-gray-700 dark:text-gray-300">{interpretation.clinical_significance}</span></p>
                      {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                        <p><strong className="text-gray-900 dark:text-white">Recommendations:</strong> <span className="text-gray-700 dark:text-gray-300">{interpretation.recommendations.join(', ')}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
          
          <CollapsibleSection title="Overall Assessment">
            <div className="medical-card">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{analysisResult.overall_assessment}</p>
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );

  const renderCases = () => (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Patient Cases
        </h2>
        <Button 
          variant="secondary"
          onClick={() => setCurrentView('home')}
          icon={<Icons.ArrowLeft />}
        >
          Back
        </Button>
      </div>
      
      {/* Query Section */}
      <Card className="p-6 mb-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about cases (e.g., 'Show yesterday's CBC results')"
                className="w-full"
              />
            </div>
            <Button 
              variant="primary"
              onClick={handleQuery} 
              loading={loading}
              icon={<Icons.Search />}
            >
              Search
            </Button>
          </div>
          
          {queryResult && (
            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Search Results:</h4>
              <p className="text-gray-700 dark:text-gray-300">{queryResult.response}</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Advanced Search */}
      <Card className="p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Advanced Search & Filters</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="From Date"
              type="date"
              value={searchFilters.date_from}
              onChange={(e) => setSearchFilters({...searchFilters, date_from: e.target.value})}
            />
            <Input
              label="To Date"
              type="date"
              value={searchFilters.date_to}
              onChange={(e) => setSearchFilters({...searchFilters, date_to: e.target.value})}
            />
            <Input
              label="Min Confidence"
              type="number"
              min="0"
              max="100"
              value={searchFilters.confidence_min}
              onChange={(e) => setSearchFilters({...searchFilters, confidence_min: e.target.value})}
              placeholder="0-100"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Has Files</label>
              <select
                value={searchFilters.has_files}
                onChange={(e) => setSearchFilters({...searchFilters, has_files: e.target.value})}
                className="input"
              >
                <option value="">Any</option>
                <option value="true">With Files</option>
                <option value="false">Without Files</option>
              </select>
            </div>
            <Input
              label="Search Text"
              value={searchFilters.search_text}
              onChange={(e) => setSearchFilters({...searchFilters, search_text: e.target.value})}
              placeholder="Search in case summary..."
            />
            <div className="flex items-end">
              <Button 
                variant="primary"
                onClick={handleAdvancedSearch}
                loading={loading}
                className="w-full"
                icon={<Icons.Search />}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
        
        {searchResults && (
          <div className="mt-4 p-4 bg-success-50 dark:bg-success-900/20 border-l-4 border-success-500 rounded">
            <h4 className="font-semibold text-gray-900 dark:text-white">Found {searchResults.total_found} cases</h4>
          </div>
        )}
      </Card>
      
      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(searchResults ? searchResults.cases : cases).map((case_item, index) => (
          <Card key={case_item.id} className="p-6" style={{animationDelay: `${index * 0.1}s`}}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Case {case_item.id.substring(0, 8)}
                </h4>
                {case_item.patient_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Patient: {case_item.patient_name}
                    {case_item.patient_id && ` (ID: ${case_item.patient_id})`}
                  </p>
                )}
                {case_item.patient_age && case_item.patient_gender && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {case_item.patient_age} years old, {case_item.patient_gender}
                  </p>
                )}
              </div>
              <Badge variant="secondary" size="sm">
                {new Date(case_item.created_at).toLocaleDateString()}
              </Badge>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
              {case_item.patient_summary.substring(0, 150)}...
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{case_item.uploaded_files.length} files</span>
                {case_item.confidence_score && (
                  <Badge 
                    variant={case_item.confidence_score >= 80 ? 'success' : case_item.confidence_score >= 60 ? 'warning' : 'error'}
                    size="sm"
                  >
                    {case_item.confidence_score}%
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {case_item.doctor_name && `Dr. ${case_item.doctor_name}`}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={() => viewCase(case_item.id)}
                >
                  View Details
                </Button>
                {case_item.analysis_result && (
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => exportToPDF(case_item.id)}
                    icon={<Icons.Download />}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCaseDetail = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Case Details
        </h2>
        <div className="flex gap-2">
          {selectedCase?.analysis_result && (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => exportToPDF(selectedCase.id)}
              icon={<Icons.Download />}
            >
              Export PDF
            </Button>
          )}
          <Button 
            variant="secondary"
            onClick={() => setCurrentView('cases')}
            icon={<Icons.ArrowLeft />}
          >
            Back to Cases
          </Button>
        </div>
      </div>
      
      {selectedCase && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Patient Summary</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{selectedCase.patient_summary}</p>
            
            <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span>Created: {new Date(selectedCase.created_at).toLocaleString()}</span>
              <span>Files: {selectedCase.uploaded_files.length}</span>
            </div>
          </Card>
          
          {selectedCase.analysis_result && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Results</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="success"
                    size="sm"
                    onClick={() => submitFeedback(selectedCase.id, 'positive')}
                    icon={<Icons.ThumbsUp />}
                  >
                    Good
                  </Button>
                  <Button 
                    variant="error"
                    size="sm"
                    onClick={() => submitFeedback(selectedCase.id, 'negative')}
                    icon={<Icons.ThumbsDown />}
                  >
                    Poor
                  </Button>
                </div>
              </div>
              
              <CollapsibleSection title="Confidence Score" defaultOpen={true}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Confidence Score: {selectedCase.confidence_score}%
                    </h4>
                    <Badge 
                      variant={selectedCase.confidence_score >= 80 ? 'success' : selectedCase.confidence_score >= 60 ? 'warning' : 'error'}
                      size="lg"
                    >
                      {selectedCase.confidence_score >= 80 ? 'High' : selectedCase.confidence_score >= 60 ? 'Medium' : 'Low'} Confidence
                    </Badge>
                  </div>
                  <ProgressBar 
                    value={selectedCase.confidence_score} 
                    color={selectedCase.confidence_score >= 80 ? 'success' : selectedCase.confidence_score >= 60 ? 'warning' : 'error'}
                  />
                </div>
              </CollapsibleSection>
              
              <CollapsibleSection title="SOAP Notes" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedCase.analysis_result.soap_note).map(([key, value]) => (
                    <div key={key} className="soap-card">
                      <h5 className="font-semibold text-gray-900 dark:text-white capitalize mb-2">{key}</h5>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {selectedCase.analysis_result.file_interpretations && selectedCase.analysis_result.file_interpretations.length > 0 && (
                <CollapsibleSection title="Individual File Interpretations">
                  <div className="space-y-4">
                    {selectedCase.analysis_result.file_interpretations.map((interpretation, index) => (
                      <div key={index} className="medical-card">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">📁</span>
                          <h5 className="font-semibold text-gray-900 dark:text-white">{interpretation.file_name}</h5>
                          <Badge variant="secondary">{interpretation.file_type}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          {interpretation.key_findings && interpretation.key_findings.length > 0 && (
                            <p><strong className="text-gray-900 dark:text-white">Key Findings:</strong> <span className="text-gray-700 dark:text-gray-300">{interpretation.key_findings.join(', ')}</span></p>
                          )}
                          {interpretation.abnormal_values && interpretation.abnormal_values.length > 0 && (
                            <p><strong className="text-gray-900 dark:text-white">Abnormal Values:</strong> <span className="text-error-600">{interpretation.abnormal_values.join(', ')}</span></p>
                          )}
                          <p><strong className="text-gray-900 dark:text-white">Clinical Significance:</strong> <span className="text-gray-700 dark:text-gray-300">{interpretation.clinical_significance}</span></p>
                          {interpretation.recommendations && interpretation.recommendations.length > 0 && (
                            <p><strong className="text-gray-900 dark:text-white">Recommendations:</strong> <span className="text-gray-700 dark:text-gray-300">{interpretation.recommendations.join(', ')}</span></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
              
              <CollapsibleSection title="Overall Assessment">
                <div className="medical-card">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedCase.analysis_result.overall_assessment}</p>
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Show loading screen during initial authentication check
  if (authLoading && !isAuthenticated && !authError) {
    return renderLoadingScreen();
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        {currentView === 'login' && renderLogin()}
        {currentView === 'register' && renderRegister()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="glass border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-medical-500 to-medical-600 rounded-lg">
                  <Icons.Medical />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Clinical Insight Assistant
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant={currentView === 'home' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentView('home')}
                  icon={<Icons.Home />}
                >
                  Home
                </Button>
                <Button
                  variant={currentView === 'new-case' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentView('new-case')}
                  icon={<Icons.Plus />}
                >
                  New Case
                </Button>
                <Button
                  variant={currentView === 'cases' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentView('cases')}
                  icon={<Icons.Cases />}
                >
                  Cases
                </Button>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle 
                isDark={isDark} 
                toggle={toggleTheme}
                className="hidden sm:flex"
              />
              
              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Icons.User />
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dr. {currentUser?.full_name || currentUser?.username}
                  </span>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={logout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && renderHome()}
        {currentView === 'new-case' && renderNewCase()}
        {currentView === 'cases' && renderCases()}
        {currentView === 'case-detail' && renderCaseDetail()}
      </main>
    </div>
  );
};

// Main App with Theme Provider
const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;