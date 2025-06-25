import React from 'react';

const App = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Clinical Insight Assistant</h1>
      <p>Application is loading...</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Debug Information:</h2>
        <p>React is working!</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default App;
const Card = ({ children, className = '', ...props }) => (
  <div 
    className={`
      relative overflow-hidden
      bg-white/90 dark:bg-gray-900/90 
      backdrop-blur-xl border border-white/20 dark:border-gray-700/30
      rounded-2xl shadow-lg hover:shadow-xl
      transition-all duration-300 hover:scale-[1.02]
      ${className}
    `} 
    {...props}
  >
    <div className="relative z-10">{children}</div>
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, icon = null, className = '', ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white shadow-neon border-primary-500/50',
    secondary: 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:via-gray-700 dark:hover:to-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600',
    success: 'bg-gradient-to-r from-success-500 via-success-600 to-success-700 hover:from-success-600 hover:via-success-700 hover:to-success-800 text-white shadow-lg border-success-500/50',
    error: 'bg-gradient-to-r from-error-500 via-error-600 to-error-700 hover:from-error-600 hover:via-error-700 hover:to-error-800 text-white shadow-lg border-error-500/50',
    warning: 'bg-gradient-to-r from-warning-500 via-warning-600 to-warning-700 hover:from-warning-600 hover:via-warning-700 hover:to-warning-800 text-white shadow-lg border-warning-500/50',
    accent: 'bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 hover:from-accent-600 hover:via-accent-700 hover:to-accent-800 text-white shadow-neon-accent border-accent-500/50',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-gray-900 dark:text-white hover:bg-white/20',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  };

  return (
    <button
      className={`
        ${variants[variant]} ${sizes[size]}
        font-semibold border transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:shadow-lg hover:scale-105 active:scale-95
        flex items-center justify-center gap-2 relative overflow-hidden
        group ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
      )}
      {icon && !loading && <span className="text-lg">{icon}</span>}
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
    </button>
  );
};

const Input = ({ label, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input
      className={`
        input transition-all duration-300 
        ${error ? 'border-error-500 focus:border-error-600' : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'}
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-error-500 text-sm mt-1">{error}</p>}
  </div>
);

const Textarea = ({ label, error, className = '', ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea
      className={`
        input transition-all duration-300 resize-none
        ${error ? 'border-error-500 focus:border-error-600' : 'border-gray-300 dark:border-gray-600 focus:border-primary-500'}
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-error-500 text-sm mt-1">{error}</p>}
  </div>
);

const Badge = ({ children, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
    error: 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300',
    neon: 'bg-neon-100 text-neon-800 dark:bg-neon-900 dark:text-neon-300',
  };
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`${variants[variant]} ${sizes[size]} rounded-full font-medium ${className}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, max = 100, color = 'primary', className = '' }) => {
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    neon: 'bg-neon-500',
  };

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 ${className}`}>
      <div 
        className={`${colors[color]} h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
      </div>
    </div>
  );
};

// Enhanced CollapsibleSection with ultra-modern design
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Card className="mb-6 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          {title}
        </h3>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown />
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 animate-slide-down">
          {children}
        </div>
      )}
    </Card>
  );
};

// Icons component with modern icons
const Icons = {
  Medical: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Cases: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Analysis: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  ThumbsUp: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2v0a2 2 0 00-2 2v5m7 5V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ThumbsDown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2v0a2 2 0 002-2v-5m-7-5v10a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
    </svg>
  ),
  Microphone: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Save: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// Theme Toggle Component
const ThemeToggle = ({ isDark, toggle, className = '' }) => (
  <Button
    variant="glass"
    size="sm"
    onClick={toggle}
    className={`${className} p-2`}
    icon={isDark ? <Icons.Sun /> : <Icons.Moon />}
  />
);

// Theme Context
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Main App Component with enhanced features
const AppContent = () => {
  const { isDark, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  // Enhanced state management
  const [patientSummary, setPatientSummary] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [feedbackStats, setFeedbackStats] = useState(null);
  
  // Enhanced patient details state with validation
  const [patientDetails, setPatientDetails] = useState({
    patient_id: '',
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    patient_dob: '',
    patient_address: '',
    emergency_contact: '',
    doctor_name: '',
  });
  
  // Doctor profile state
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    medical_license: '',
    specialization: '',
    years_of_experience: '',
    hospital_affiliation: '',
    phone_number: '',
    bio: '',
    email: ''
  });
  
  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    date_from: '',
    date_to: '',
    confidence_min: '',
    has_files: '',
    search_text: ''
  });

  // Speech recognition
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPatientSummary(prev => prev + transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      setHasRecognitionSupport(true);
    }
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setAuthLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        console.log('Checking session token:', sessionToken);
        const response = await axios.get(`${API_BASE_URL}/api/auth/verify`, {
          params: { session_token: sessionToken },
          timeout: 10000 // 10 second timeout
        });
        
        console.log('Auth response:', response.data);
        if (response.data.valid) {
          setIsAuthenticated(true);
          setCurrentUser(response.data.user);
          loadDashboardData();
          loadDoctorProfile(sessionToken);
        } else {
          localStorage.removeItem('sessionToken');
          setCurrentView('login');
        }
      } else {
        console.log('No session token found');
        setCurrentView('login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('sessionToken');
      setCurrentView('login');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadDoctorProfile = async (sessionToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        params: { session_token: sessionToken }
      });
      setDoctorProfile(response.data);
      setProfileData(response.data);
    } catch (error) {
      console.error('Failed to load doctor profile:', error);
    }
  };

  const updateDoctorProfile = async () => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await axios.put(
        `${API_BASE_URL}/api/profile?session_token=${sessionToken}`,
        profileData
      );
      
      setDoctorProfile(profileData);
      setIsEditingProfile(false);
      // Success notification would go here
    } catch (error) {
      console.error('Failed to update profile:', error);
      setAuthError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load cases
      const casesResponse = await axios.get(`${API_BASE_URL}/api/cases`);
      setCases(casesResponse.data);
      
      // Load feedback stats  
      const statsResponse = await axios.get(`${API_BASE_URL}/api/feedback/stats`);
      setFeedbackStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleLogin = async (username, password) => {
    setLoading(true);
    setAuthError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password
      });
      
      const { session_token, user } = response.data;
      localStorage.setItem('sessionToken', session_token);
      setIsAuthenticated(true);
      setCurrentUser(user);
      loadDashboardData();
      loadDoctorProfile(session_token);
    } catch (error) {
      setAuthError(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setAuthError('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      // Auto-login after registration
      await handleLogin(userData.username, userData.password);
    } catch (error) {
      setAuthError(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        await axios.post(`${API_BASE_URL}/api/auth/logout?session_token=${sessionToken}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('sessionToken');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView('login');
    }
  };

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const createCase = async () => {
    if (!patientSummary.trim()) return;
    
    // Validate required patient fields
    if (!patientDetails.patient_id || !patientDetails.patient_name || !patientDetails.patient_age || !patientDetails.patient_gender) {
      setAuthError('Please fill in all required patient information (ID, Name, Age, Gender)');
      return;
    }

    setLoading(true);
    setAuthError('');
    
    try {
      // Create case with enhanced patient details
      const caseData = {
        patient_summary: patientSummary,
        ...patientDetails,
        patient_age: parseInt(patientDetails.patient_age),
        doctor_id: currentUser?.id || 'default_doctor',
        doctor_name: patientDetails.doctor_name || currentUser?.full_name || currentUser?.username || 'Dr. Unknown'
      };

      const caseResponse = await axios.post(`${API_BASE_URL}/api/cases`, caseData);
      const caseId = caseResponse.data.id;

      // Upload files if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        await axios.post(`${API_BASE_URL}/api/cases/${caseId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Analyze case
      const analysisResponse = await axios.post(`${API_BASE_URL}/api/cases/${caseId}/analyze`);
      setAnalysisResult({
        ...analysisResponse.data,
        case_id: caseId
      });

      // Reset form
      setPatientSummary('');
      setSelectedFiles([]);
      setPatientDetails({
        patient_id: '',
        patient_name: '',
        patient_age: '',
        patient_gender: '',
        patient_dob: '',
        patient_address: '',
        emergency_contact: '',
        doctor_name: currentUser?.full_name || currentUser?.username || '',
      });

      // Reload cases
      loadDashboardData();
      
    } catch (error) {
      console.error('Case creation error:', error);
      setAuthError(error.response?.data?.detail || 'Failed to create and analyze case');
    } finally {
      setLoading(false);
    }
  };

  const viewCase = async (caseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cases/${caseId}`);
      setSelectedCase(response.data);
      setCurrentView('case-detail');
    } catch (error) {
      console.error('Failed to load case:', error);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/query`, {
        query: query,
        doctor_id: currentUser?.id || 'default_doctor'
      });
      setQueryResult(response.data);
    } catch (error) {
      console.error('Query failed:', error);
      setQueryResult({ response: 'Sorry, I could not process your query. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async () => {
    setLoading(true);
    try {
      const filters = {
        ...searchFilters,
        doctor_id: currentUser?.id || 'default_doctor'
      };
      
      const response = await axios.post(`${API_BASE_URL}/api/cases/search`, filters);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (caseId, feedbackType) => {
    try {
      await axios.post(`${API_BASE_URL}/api/feedback`, {
        case_id: caseId,
        doctor_id: currentUser?.id || 'default_doctor',
        feedback_type: feedbackType
      });
      
      // Reload feedback stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/feedback/stats`);
      setFeedbackStats(statsResponse.data);
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  const exportToPDF = async (caseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cases/${caseId}/export-pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinical_case_${caseId.substring(0, 8)}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  // Enhanced authentication forms with ultra-modern design
  const renderLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      handleLogin(username, password);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-mesh dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-500/10 rounded-full blur-5xl animate-pulse-subtle"></div>
        </div>
        
        <Card className="w-full max-w-md relative z-10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl mb-4 animate-bounce-subtle">
              <Icons.Medical className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your clinical dashboard</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-error-700 dark:text-error-300 text-sm">{authError}</p>
                <button 
                  onClick={() => setAuthError('')}
                  className="text-error-500 hover:text-error-700 transition-colors"
                >
                  <Icons.X />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              required
            />
            
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full"
              loading={loading}
              disabled={!username || !password}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <button 
                onClick={() => setCurrentView('register')} 
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>
        </Card>
      </div>
    );
  };

  const renderRegister = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      medical_license: '',
      specialization: '',
      years_of_experience: '',
      hospital_affiliation: '',
      phone_number: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        setAuthError('Passwords do not match');
        return;
      }
      
      const { confirmPassword, ...userData } = formData;
      userData.years_of_experience = parseInt(userData.years_of_experience) || 0;
      handleRegister(userData);
    };

    const updateFormData = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="min-h-screen bg-gradient-mesh dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>
        
        <Card className="w-full max-w-2xl relative z-10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl mb-4 animate-bounce-subtle">
              <Icons.Medical className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Join Our Platform
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create your clinical account</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
              <div className="flex items-center justify-between">
                <p className="text-error-700 dark:text-error-300 text-sm">{authError}</p>
                <button 
                  onClick={() => setAuthError('')}
                  className="text-error-500 hover:text-error-700 transition-colors"
                >
                  <Icons.X />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username *"
                type="text"
                value={formData.username}
                onChange={(e) => updateFormData('username', e.target.value)}
                placeholder="Choose a username"
                required
              />
              
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Create a strong password"
                required
              />
              
              <Input
                label="Confirm Password *"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
              />
              
              <Input
                label="Full Name *"
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                placeholder="Dr. Your Full Name"
                required
              />
              
              <Input
                label="Medical License *"
                type="text"
                value={formData.medical_license}
                onChange={(e) => updateFormData('medical_license', e.target.value)}
                placeholder="License number"
                required
              />
              
              <Input
                label="Specialization *"
                type="text"
                value={formData.specialization}
                onChange={(e) => updateFormData('specialization', e.target.value)}
                placeholder="Medical specialization"
                required
              />
              
              <Input
                label="Years of Experience *"
                type="number"
                min="0"
                max="50"
                value={formData.years_of_experience}
                onChange={(e) => updateFormData('years_of_experience', e.target.value)}
                placeholder="Years practicing"
                required
              />
              
              <Input
                label="Hospital Affiliation"
                type="text"
                value={formData.hospital_affiliation}
                onChange={(e) => updateFormData('hospital_affiliation', e.target.value)}
                placeholder="Hospital or clinic name"
              />
              
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone_number}
                onChange={(e) => updateFormData('phone_number', e.target.value)}
                placeholder="Contact number"
              />
            </div>
            
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full"
              loading={loading}
              disabled={!formData.username || !formData.email || !formData.password || !formData.confirmPassword}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button 
                onClick={() => setCurrentView('login')} 
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </Card>
      </div>
    );
  };

  const renderLoadingScreen = () => (
    <div className="min-h-screen bg-gradient-mesh dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl mb-4 animate-bounce-subtle">
          <Icons.Medical className="w-10 h-10 text-white" />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading Clinical Dashboard...</p>
      </div>
    </div>
  );

  // Enhanced Home Dashboard with ultra-modern design
  const renderHome = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section with enhanced gradients */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500/90 via-accent-500/90 to-neon-500/90 p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
        <div className="relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Dr. {currentUser?.full_name || currentUser?.username}
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Your AI-powered clinical assistant is ready to help you analyze patient cases with advanced multimodal reasoning and evidence-based insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="glass" 
                size="lg"
                onClick={() => setCurrentView('new-case')}
                icon={<Icons.Plus />}
                className="text-white hover:bg-white/20"
              >
                Analyze New Case
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                onClick={() => setCurrentView('cases')}
                icon={<Icons.Cases />}
                className="text-white hover:bg-white/20"
              >
                View Case History
              </Button>
              <Button 
                variant="glass" 
                size="lg"
                onClick={() => setCurrentView('profile')}
                icon={<Icons.Profile />}
                className="text-white hover:bg-white/20"
              >
                Manage Profile
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-10 right-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Stats Cards with enhanced design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card border-l-4 border-primary-500 hover:scale-105 transition-all duration-300">
          <div className="stat-number text-primary-600 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            {cases.length}
          </div>
          <div className="stat-label">Total Cases</div>
          <div className="absolute top-4 right-4 text-primary-500/30">
            <Icons.Cases className="w-8 h-8" />
          </div>
        </Card>
        
        <Card className="stat-card border-l-4 border-success-500 hover:scale-105 transition-all duration-300">
          <div className="stat-number text-success-600 bg-gradient-to-r from-success-600 to-success-800 bg-clip-text text-transparent">
            {cases.filter(c => c.analysis_result).length}
          </div>
          <div className="stat-label">Analyzed Cases</div>
          <div className="absolute top-4 right-4 text-success-500/30">
            <Icons.Analysis className="w-8 h-8" />
          </div>
        </Card>
        
        <Card className="stat-card border-l-4 border-neon-500 hover:scale-105 transition-all duration-300">
          <div className="stat-number text-neon-600 bg-gradient-to-r from-neon-600 to-neon-800 bg-clip-text text-transparent">
            {cases.reduce((acc, c) => acc + (c.uploaded_files?.length || 0), 0)}
          </div>
          <div className="stat-label">Files Processed</div>
          <div className="absolute top-4 right-4 text-neon-500/30">
            <Icons.Download className="w-8 h-8" />
          </div>
        </Card>
        
        <Card className="stat-card border-l-4 border-accent-500 hover:scale-105 transition-all duration-300">
          <div className="stat-number text-accent-600 bg-gradient-to-r from-accent-600 to-accent-800 bg-clip-text text-transparent">
            {Math.round(cases.reduce((acc, c) => acc + (c.confidence_score || 0), 0) / (cases.length || 1))}%
          </div>
          <div className="stat-label">Avg Confidence</div>
          <div className="absolute top-4 right-4 text-accent-500/30">
            <Icons.ThumbsUp className="w-8 h-8" />
          </div>
        </Card>
      </div>

      {/* Recent Cases with enhanced design */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Recent Cases
          </h2>
          <Button 
            variant="accent"
            size="sm"
            onClick={() => setCurrentView('cases')}
            icon={<Icons.ArrowLeft className="rotate-180" />}
          >
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.slice(0, 6).map((case_item, index) => (
            <Card key={case_item.id} className="hover:scale-105 transition-all duration-300 cursor-pointer" onClick={() => viewCase(case_item.id)} style={{animationDelay: `${index * 0.1}s`}}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Case {case_item.id.substring(0, 8)}
                    </h4>
                    {case_item.patient_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Patient: {case_item.patient_name}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" size="sm">
                    {new Date(case_item.created_at).toLocaleDateString()}
                  </Badge>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm">
                  {case_item.patient_summary.substring(0, 100)}...
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{case_item.uploaded_files?.length || 0} files</span>
                    {case_item.confidence_score && (
                      <Badge 
                        variant={case_item.confidence_score >= 80 ? 'success' : case_item.confidence_score >= 60 ? 'warning' : 'error'}
                        size="sm"
                      >
                        {case_item.confidence_score}%
                      </Badge>
                    )}
                  </div>
                  {case_item.analysis_result && (
                    <Button 
                      variant="glass"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF(case_item.id);
                      }}
                      icon={<Icons.Download />}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Feedback Statistics */}
      {feedbackStats && (
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-8">
            AI Performance Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="stat-card border-l-4 border-success-500">
              <div className="stat-number text-success-600">{feedbackStats.positive_feedback}</div>
              <div className="stat-label">Positive Reviews</div>
            </Card>
            <Card className="stat-card border-l-4 border-error-500">
              <div className="stat-number text-error-600">{feedbackStats.negative_feedback}</div>
              <div className="stat-label">Needs Improvement</div>
            </Card>
            <Card className="stat-card border-l-4 border-warning-500">
              <div className="stat-number text-warning-600">{feedbackStats.satisfaction_rate}%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Features Section with enhanced visuals */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📋', title: 'SOAP Notes', desc: 'Automatically generate structured clinical documentation', color: 'primary' },
            { icon: '🔬', title: 'Lab Analysis', desc: 'Interpret lab reports and medical data with AI precision', color: 'success' },
            { icon: '🏥', title: 'Medical Imaging', desc: 'Analyze X-rays, CT scans, and other medical images', color: 'neon' },
            { icon: '🧠', title: 'AI Diagnosis', desc: 'Get differential diagnoses with confidence scores', color: 'accent' },
            { icon: '🎤', title: 'Voice Dictation', desc: 'Use speech-to-text for hands-free case entry', color: 'warning' },
            { icon: '📊', title: 'Analytics', desc: 'Track AI performance and improve over time', color: 'error' }
          ].map((feature, index) => (
            <Card key={index} className="p-6 text-center hover:scale-105 transition-transform duration-300 group" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="text-4xl mb-4 group-hover:animate-bounce-subtle">{feature.icon}</div>
              <h3 className={`text-xl font-semibold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-${feature.color}-600 to-${feature.color}-800 bg-clip-text text-transparent`}>
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // Doctor Profile View
  const renderProfile = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Doctor Profile
        </h2>
        <div className="flex gap-2">
          {!isEditingProfile ? (
            <Button 
              variant="primary"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              icon={<Icons.Edit />}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                variant="success"
                size="sm"
                onClick={updateDoctorProfile}
                loading={loading}
                icon={<Icons.Save />}
              >
                Save Changes
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileData(doctorProfile || {});
                }}
                icon={<Icons.X />}
              >
                Cancel
              </Button>
            </>
          )}
          <Button 
            variant="secondary"
            onClick={() => setCurrentView('home')}
            icon={<Icons.ArrowLeft />}
          >
            Back
          </Button>
        </div>
      </div>

      {authError && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-error-700 dark:text-error-300 text-sm">{authError}</p>
            <button 
              onClick={() => setAuthError('')}
              className="text-error-500 hover:text-error-700 transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>
      )}

      <Card className="p-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="text-center border-b border-gray-200 dark:border-gray-600 pb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mb-4">
              <Icons.User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {doctorProfile?.full_name || 'Doctor Profile'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {doctorProfile?.specialization || 'Medical Professional'}
            </p>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              value={profileData.full_name || ''}
              onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
              disabled={!isEditingProfile}
              placeholder="Dr. Your Full Name"
            />
            
            <Input
              label="Email"
              type="email"
              value={profileData.email || ''}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              disabled={!isEditingProfile}
              placeholder="your.email@example.com"
            />
            
            <Input
              label="Medical License"
              value={profileData.medical_license || ''}
              onChange={(e) => setProfileData({...profileData, medical_license: e.target.value})}
              disabled={!isEditingProfile}
              placeholder="License number"
            />
            
            <Input
              label="Specialization"
              value={profileData.specialization || ''}
              onChange={(e) => setProfileData({...profileData, specialization: e.target.value})}
              disabled={!isEditingProfile}
              placeholder="Medical specialization"
            />
            
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              max="50"
              value={profileData.years_of_experience || ''}
              onChange={(e) => setProfileData({...profileData, years_of_experience: e.target.value})}
              disabled={!isEditingProfile}
              placeholder="Years practicing"
            />
            
            <Input
              label="Phone Number"
              type="tel"
              value={profileData.phone_number || ''}
              onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
              disabled={!isEditingProfile}
              placeholder="Contact number"
            />
          </div>

          <Input
            label="Hospital Affiliation"
            value={profileData.hospital_affiliation || ''}
            onChange={(e) => setProfileData({...profileData, hospital_affiliation: e.target.value})}
            disabled={!isEditingProfile}
            placeholder="Hospital or clinic name"
          />

          <Textarea
            label="Professional Bio"
            value={profileData.bio || ''}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            disabled={!isEditingProfile}
            placeholder="Brief professional biography..."
            rows="4"
          />
        </div>
      </Card>
    </div>
  );

  // Rest of the render methods remain the same but with enhanced styling...
  // (renderNewCase, renderCases, renderCaseDetail methods would continue here)
  // For brevity, I'm including the key structural changes and will continue with the remaining methods

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

      {authError && (
        <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-error-700 dark:text-error-300 text-sm">{authError}</p>
            <button 
              onClick={() => setAuthError('')}
              className="text-error-500 hover:text-error-700 transition-colors"
            >
              <Icons.X />
            </button>
          </div>
        </div>
      )}
      
      <Card className="p-8 mb-8">
        <div className="space-y-6">
          {/* Patient Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Patient ID *"
                value={patientDetails.patient_id}
                onChange={(e) => setPatientDetails({...patientDetails, patient_id: e.target.value})}
                placeholder="Patient ID (required)"
              />
              <Input
                label="Patient Name *"
                value={patientDetails.patient_name}
                onChange={(e) => setPatientDetails({...patientDetails, patient_name: e.target.value})}
                placeholder="Patient full name (required)"
              />
              <Input
                label="Age *"
                type="number"
                min="0"
                max="150"
                value={patientDetails.patient_age}
                onChange={(e) => setPatientDetails({...patientDetails, patient_age: e.target.value})}
                placeholder="Age (required)"
              />
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  value={patientDetails.patient_gender}
                  onChange={(e) => setPatientDetails({...patientDetails, patient_gender: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Select Gender (required)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Additional Patient Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Input
                label="Date of Birth"
                type="date"
                value={patientDetails.patient_dob}
                onChange={(e) => setPatientDetails({...patientDetails, patient_dob: e.target.value})}
                placeholder="Date of birth (optional)"
              />
              <Input
                label="Address"
                value={patientDetails.patient_address}
                onChange={(e) => setPatientDetails({...patientDetails, patient_address: e.target.value})}
                placeholder="Patient address (optional)"
              />
              <Input
                label="Emergency Contact"
                value={patientDetails.emergency_contact}
                onChange={(e) => setPatientDetails({...patientDetails, emergency_contact: e.target.value})}
                placeholder="Emergency contact (optional)"
              />
            </div>
          </div>

          {/* Doctor Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-600 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Doctor Information
            </h3>
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
              className="input cursor-pointer hover:border-primary-500 transition-colors"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported: Lab reports (CSV, PDF), Medical images (JPG, PNG, DICOM)
            </p>
            {selectedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-lg shadow-sm">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{file.name}</span>
                      <Badge variant="neon" size="sm">{(file.size / 1024).toFixed(1)} KB</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="success"
            size="lg"
            className="w-full bg-gradient-to-r from-success-500 via-success-600 to-success-700 hover:from-success-600 hover:via-success-700 hover:to-success-800"
            onClick={createCase}
            loading={loading}
            disabled={!patientSummary.trim() || !patientDetails.patient_id || !patientDetails.patient_name || !patientDetails.patient_age || !patientDetails.patient_gender}
            icon={<Icons.Analysis />}
          >
            {loading ? 'Analyzing...' : 'Analyze Case'}
          </Button>
        </div>
      </Card>
      
      {analysisResult && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Clinical Analysis Results
            </h3>
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
                <div key={key} className="soap-card bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h5 className="font-semibold text-gray-900 dark:text-white capitalize mb-2 text-lg">
                    {key}
                  </h5>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Differential Diagnoses" defaultOpen={true}>
            <div className="space-y-4">
              {analysisResult.differential_diagnoses.map((diagnosis, index) => (
                <div key={index} className="diagnosis-card bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-900 dark:text-white text-lg">{diagnosis.diagnosis}</h5>
                    <Badge variant="warning" size="lg" className="bg-gradient-to-r from-warning-400 to-warning-600 text-white">
                      {diagnosis.likelihood}%
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{diagnosis.rationale}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
          
          <CollapsibleSection title="Recommendations & Investigations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="recommendation-card bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 p-6 rounded-xl border border-success-200 dark:border-success-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg flex items-center gap-2">
                  <span className="w-3 h-3 bg-success-500 rounded-full"></span>
                  Treatment Recommendations
                </h4>
                <ul className="space-y-2">
                  {analysisResult.treatment_recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-success-500 mt-1 text-lg">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="recommendation-card bg-gradient-to-br from-neon-50 to-neon-100 dark:from-neon-900/20 dark:to-neon-800/20 p-6 rounded-xl border border-neon-200 dark:border-neon-800">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg flex items-center gap-2">
                  <span className="w-3 h-3 bg-neon-500 rounded-full"></span>
                  Investigation Suggestions
                </h4>
                <ul className="space-y-2">
                  {analysisResult.investigation_suggestions.map((inv, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-neon-500 mt-1 text-lg">•</span>
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
                  <div key={index} className="medical-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📁</span>
                      <h5 className="font-semibold text-gray-900 dark:text-white text-lg">{interpretation.file_name}</h5>
                      <Badge variant="secondary">{interpretation.file_type}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {interpretation.key_findings && interpretation.key_findings !== 'No specific findings' && (
                        <p>
                          <strong className="text-gray-900 dark:text-white">Key Findings:</strong> 
                          <span className="text-gray-700 dark:text-gray-300 ml-2">{interpretation.key_findings}</span>
                        </p>
                      )}
                      {interpretation.abnormal_values && interpretation.abnormal_values !== 'None detected' && (
                        <p>
                          <strong className="text-gray-900 dark:text-white">Abnormal Values:</strong> 
                          <span className="text-error-600 ml-2">{interpretation.abnormal_values}</span>
                        </p>
                      )}
                      <p>
                        <strong className="text-gray-900 dark:text-white">Clinical Significance:</strong> 
                        <span className="text-gray-700 dark:text-gray-300 ml-2">{interpretation.clinical_significance}</span>
                      </p>
                      {interpretation.recommendations && interpretation.recommendations !== 'None' && (
                        <p>
                          <strong className="text-gray-900 dark:text-white">Recommendations:</strong> 
                          <span className="text-gray-700 dark:text-gray-300 ml-2">{interpretation.recommendations}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
          
          <CollapsibleSection title="Overall Assessment">
            <div className="medical-card bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{analysisResult.overall_assessment}</p>
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
      
      {/* Enhanced Query Section */}
      <Card className="p-6 mb-8 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-200 dark:border-primary-800">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Natural Language Search
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about cases (e.g., 'Show yesterday's CBC results', 'Find patients with diabetes')"
                className="w-full"
              />
            </div>
            <Button 
              variant="primary"
              onClick={handleQuery} 
              loading={loading}
              icon={<Icons.Search />}
              className="bg-gradient-to-r from-primary-500 to-accent-500"
            >
              Search
            </Button>
          </div>
          
          {queryResult && (
            <div className="mt-4 p-4 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border-l-4 border-success-500 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Icons.Search className="w-5 h-5 text-success-600" />
                Search Results:
              </h4>
              <p className="text-gray-700 dark:text-gray-300">{queryResult.response}</p>
            </div>
          )}
        </div>
      </Card>
      
      {/* Enhanced Advanced Search */}
      <Card className="p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Advanced Search & Filters
        </h3>
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
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500"
                icon={<Icons.Search />}
              >
                Search
              </Button>
            </div>
          </div>
        </div>
        
        {searchResults && (
          <div className="mt-4 p-4 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 border-l-4 border-success-500 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Found {searchResults.total_found} cases
            </h4>
          </div>
        )}
      </Card>
      
      {/* Enhanced Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(searchResults ? searchResults.cases : cases).map((case_item, index) => (
          <Card key={case_item.id} className="hover:scale-105 transition-all duration-300 cursor-pointer group" onClick={() => viewCase(case_item.id)} style={{animationDelay: `${index * 0.1}s`}}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    {case_item.uploaded_files?.length || 0} files
                  </span>
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
                    className="bg-gradient-to-r from-primary-500 to-accent-500"
                  >
                    View Details
                  </Button>
                  {case_item.analysis_result && (
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF(case_item.id);
                      }}
                      icon={<Icons.Download />}
                    />
                  )}
                </div>
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
          {/* Enhanced Case Summary Card */}
          <Card className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-200 dark:border-primary-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Patient Summary
                </h3>
                {selectedCase.patient_name && (
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Patient: <strong>{selectedCase.patient_name}</strong></span>
                    {selectedCase.patient_id && <span>ID: <strong>{selectedCase.patient_id}</strong></span>}
                    {selectedCase.patient_age && selectedCase.patient_gender && (
                      <span>{selectedCase.patient_age} years old, {selectedCase.patient_gender}</span>
                    )}
                  </div>
                )}
              </div>
              <Badge variant="primary" size="lg">
                Case {selectedCase.id.substring(0, 8)}
              </Badge>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {selectedCase.patient_summary}
            </p>
            
            <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                Created: {new Date(selectedCase.created_at).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                Files: {selectedCase.uploaded_files?.length || 0}
              </span>
              {selectedCase.doctor_name && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-accent-500 rounded-full"></span>
                  Doctor: {selectedCase.doctor_name}
                </span>
              )}
            </div>
          </Card>
          
          {selectedCase.analysis_result && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Analysis Results
                </h3>
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
                    <div key={key} className="soap-card bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h5 className="font-semibold text-gray-900 dark:text-white capitalize mb-2 text-lg">
                        {key}
                      </h5>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {selectedCase.analysis_result.file_interpretations && selectedCase.analysis_result.file_interpretations.length > 0 && (
                <CollapsibleSection title="Individual File Interpretations">
                  <div className="space-y-4">
                    {selectedCase.analysis_result.file_interpretations.map((interpretation, index) => (
                      <div key={index} className="medical-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">📁</span>
                          <h5 className="font-semibold text-gray-900 dark:text-white text-lg">{interpretation.file_name}</h5>
                          <Badge variant="secondary">{interpretation.file_type}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          {interpretation.key_findings && interpretation.key_findings !== 'No specific findings' && (
                            <p>
                              <strong className="text-gray-900 dark:text-white">Key Findings:</strong> 
                              <span className="text-gray-700 dark:text-gray-300 ml-2">{interpretation.key_findings}</span>
                            </p>
                          )}
                          {interpretation.abnormal_values && interpretation.abnormal_values !== 'None detected' && (
                            <p>
                              <strong className="text-gray-900 dark:text-white">Abnormal Values:</strong> 
                              <span className="text-error-600 ml-2">{interpretation.abnormal_values}</span>
                            </p>
                          )}
                          <p>
                            <strong className="text-gray-900 dark:text-white">Clinical Significance:</strong> 
                            <span className="text-gray-700 dark:text-gray-300 ml-2">{interpretation.clinical_significance}</span>
                          </p>
                          {interpretation.recommendations && interpretation.recommendations !== 'None' && (
                            <p>
                              <strong className="text-gray-900 dark:text-white">Recommendations:</strong> 
                              <span className="text-gray-700 dark:text-gray-300 ml-2">{interpretation.recommendations}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}
              
              <CollapsibleSection title="Overall Assessment">
                <div className="medical-card bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {selectedCase.analysis_result.overall_assessment}
                  </p>
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
        {(currentView === 'login' || currentView === 'home') && renderLogin()}
        {currentView === 'register' && renderRegister()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-neon-500/5 rounded-full blur-5xl animate-pulse-subtle" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="glass border-b backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/30 sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary-500 via-accent-500 to-neon-500 rounded-xl shadow-neon animate-bounce-subtle">
                  <Icons.Medical className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-neon-600 bg-clip-text text-transparent">
                  Clinical Insight Assistant
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enhanced Navigation Links */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant={currentView === 'home' ? 'primary' : 'glass'}
                  size="sm"
                  onClick={() => setCurrentView('home')}
                  icon={<Icons.Home />}
                  className={currentView === 'home' ? 'bg-gradient-to-r from-primary-500 to-accent-500' : ''}
                >
                  Home
                </Button>
                <Button
                  variant={currentView === 'new-case' ? 'primary' : 'glass'}
                  size="sm"
                  onClick={() => setCurrentView('new-case')}
                  icon={<Icons.Plus />}
                  className={currentView === 'new-case' ? 'bg-gradient-to-r from-primary-500 to-accent-500' : ''}
                >
                  New Case
                </Button>
                <Button
                  variant={currentView === 'cases' ? 'primary' : 'glass'}
                  size="sm"
                  onClick={() => setCurrentView('cases')}
                  icon={<Icons.Cases />}
                  className={currentView === 'cases' ? 'bg-gradient-to-r from-primary-500 to-accent-500' : ''}
                >
                  Cases
                </Button>
                <Button
                  variant={currentView === 'profile' ? 'primary' : 'glass'}
                  size="sm"
                  onClick={() => setCurrentView('profile')}
                  icon={<Icons.Profile />}
                  className={currentView === 'profile' ? 'bg-gradient-to-r from-primary-500 to-accent-500' : ''}
                >
                  Profile
                </Button>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle 
                isDark={isDark} 
                toggle={toggleTheme}
                className="hidden sm:flex"
              />
              
              {/* Enhanced User Menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30">
                  <div className="p-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
                    <Icons.User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dr. {currentUser?.full_name || currentUser?.username}
                  </span>
                </div>
                <Button 
                  variant="glass" 
                  size="sm"
                  onClick={logout}
                  className="text-gray-700 dark:text-gray-300"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {currentView === 'home' && renderHome()}
        {currentView === 'new-case' && renderNewCase()}
        {currentView === 'cases' && renderCases()}
        {currentView === 'case-detail' && renderCaseDetail()}
        {currentView === 'profile' && renderProfile()}
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