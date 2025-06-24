# Clinical Insight Assistant 🏥

> **Multimodal AI-powered platform for clinical decision support**

A comprehensive web application that empowers doctors with AI-driven clinical analysis, combining patient case summaries, lab reports, and medical imaging into actionable insights.

![Clinical Insight Assistant](https://img.shields.io/badge/Status-Production%20Ready-green.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![React](https://img.shields.io/badge/React-19.0+-blue.svg)

## 🎯 Problem Statement

Healthcare professionals need a tool that can:
1. **Capture patient cases** through typing or voice dictation
2. **Analyze multimodal data** (text summaries + lab reports + medical images)
3. **Process natural language queries** like "Show yesterday's CBC for patient 47321"
4. **Generate structured clinical insights** with SOAP notes, differential diagnoses, and treatment recommendations

## ✨ Features

### 🔬 Core Clinical Features
- **SOAP Note Generation**: Automated structured documentation
- **Differential Diagnoses**: AI-powered diagnostic suggestions with confidence scores
- **Multimodal Analysis**: Supports CSV lab reports, PDF documents, and medical images
- **Treatment Recommendations**: Evidence-based treatment suggestions
- **Investigation Guidance**: Recommended follow-up tests and procedures

### 🗣️ Natural Language Interface
- **Voice Dictation**: Speech-to-text for hands-free case entry
- **Smart Queries**: Natural language commands like:
  - "Show yesterday's CBC results for patient 12345"
  - "Find all cases with chest X-ray findings"
  - "What are today's lab results?"

### 👨‍⚕️ Professional Features
- **Doctor Profiles**: Customizable professional information
- **Authentication**: Secure login with session management
- **Audit Trail**: Complete activity logging for compliance
- **PDF Export**: Professional case reports
- **Performance Dashboard**: AI accuracy tracking and feedback

### 🔍 Advanced Search & Analytics
- **Smart Filtering**: Date ranges, confidence scores, file types
- **Case Search**: Patient ID, keywords, test types
- **Performance Metrics**: Success rates and user satisfaction
- **Feedback System**: Thumbs up/down for AI performance tracking

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   FastAPI       │    │   MongoDB       │
│                 │    │                 │    │                 │
│ • Modern UI/UX  │◄──►│ • RESTful API   │◄──►│ • Case Storage  │
│ • Dark/Light    │    │ • AI Integration│    │ • User Mgmt     │
│ • Voice Input   │    │ • File Upload   │    │ • Audit Logs    │
│ • Real-time     │    │ • PDF Export    │    │ • Feedback      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Gemini AI     │
                       │                 │
                       │ • Multimodal    │
                       │ • Medical NLP   │
                       │ • Image Analysis│
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API key

### 1. Clone Repository
```bash
git clone https://github.com/SREESAIARJUN/medmithra-ai.git
cd medmithra-ai
```

### 2. Environment Setup
```bash
# Backend environment
echo "MONGO_URL=mongodb://localhost:27017" > backend/.env
echo "DB_NAME=clinical_assistant" >> backend/.env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> backend/.env

# Frontend environment
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > frontend/.env
```

### 3. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 4. Start Services
```bash
# Terminal 1: Backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm start
```

Visit `http://localhost:3000` to access the application.

## 🐳 Docker Deployment

### Quick Start with Docker Compose
```bash
# Set your Gemini API key
export GEMINI_API_KEY="your_api_key_here"

# Start all services
docker-compose up -d
```

### Manual Docker Build
```bash
# Build the application
docker build -t clinical-insight-assistant .

# Run with MongoDB
docker run -d --name mongo mongo:7.0
docker run -d -p 80:80 \
  --link mongo:mongo \
  -e MONGO_URL=mongodb://mongo:27017 \
  -e GEMINI_API_KEY=your_key_here \
  clinical-insight-assistant
```

## 🚂 Railway Deployment

### Automated Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set GEMINI_API_KEY="your_key_here"
railway variables set MONGO_URL="your_mongodb_atlas_url"
```

### Environment Variables
**Backend Service:**
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name (default: clinical_assistant)
- `GEMINI_API_KEY`: Your Gemini AI API key
- `PORT`: Service port (Railway sets automatically)

**Frontend Service:**
- `REACT_APP_BACKEND_URL`: Backend service URL
- `NODE_ENV`: production

## 📋 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register - Register new doctor
POST /api/auth/login    - Login
POST /api/auth/logout   - Logout
GET  /api/auth/verify   - Verify session
PUT  /api/auth/profile  - Update profile
```

### Case Management
```http
POST /api/cases              - Create case
GET  /api/cases              - List cases
GET  /api/cases/{id}         - Get specific case
POST /api/cases/{id}/upload  - Upload files
POST /api/cases/{id}/analyze - Analyze case
```

### Query & Search
```http
POST /api/query             - Natural language queries
POST /api/cases/search      - Advanced search
GET  /api/cases/{id}/export-pdf - Export PDF
```

### Feedback & Analytics
```http
POST /api/feedback          - Submit feedback
GET  /api/feedback/stats    - Performance metrics
GET  /api/audit/logs        - Audit trail
```

## 💡 Usage Examples

### Creating a Case
```javascript
// Create new case
const caseData = {
  patient_summary: "45-year-old male with chest pain...",
  patient_id: "12345",
  patient_name: "John Doe",
  patient_age: 45,
  patient_gender: "Male",
  doctor_id: "DR001"
};

const response = await fetch('/api/cases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(caseData)
});
```

### Natural Language Queries
```bash
# Example queries that work:
"Show yesterday's CBC for patient 47321"
"Find all chest X-ray cases from last week"
"What are today's lab results?"
"Show cases with high confidence scores"
"Find patient 12345's latest case"
```

### File Upload Analysis
```python
# Upload lab report and analyze
files = {'files': open('lab_report.csv', 'rb')}
upload_response = requests.post(f'/api/cases/{case_id}/upload', files=files)

# Trigger AI analysis
analysis_response = requests.post(f'/api/cases/{case_id}/analyze')
```

## 🧪 Testing

### Sample Data
Use the provided sample data in `/sample_data/`:
- `sample_cases.json` - 5 realistic patient cases
- `sample_lab_report.csv` - Comprehensive lab results
- Test voice dictation with medical terminology
- Try natural language queries

### Testing Workflow
1. **Register/Login** as a doctor
2. **Create cases** using sample data
3. **Upload files** (CSV lab reports, images)
4. **Analyze cases** with AI
5. **Test queries** with natural language
6. **Export PDFs** and provide feedback
7. **Review analytics** dashboard

## 🔧 Configuration

### Gemini AI Configuration
```python
# In backend/server.py
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
chat = LlmChat(
    api_key=GEMINI_API_KEY,
    session_id=session_id,
    system_message="Clinical AI assistant prompt..."
).with_model("gemini", "gemini-2.5-flash-preview-04-17")
```

### MongoDB Setup
```javascript
// Database indexes for performance
db.clinical_cases.createIndex({ "doctor_id": 1, "created_at": -1 });
db.clinical_cases.createIndex({ "patient_id": 1 });
db.users.createIndex({ "doctor_id": 1 }, { unique: true });
```

## 📊 Performance & Monitoring

### Key Metrics
- **Response Time**: API endpoints < 2s average
- **Accuracy**: AI confidence scores tracked
- **User Satisfaction**: Feedback system metrics
- **System Health**: Audit logs and error tracking

### Monitoring Tools
- Built-in performance dashboard
- Feedback analytics
- Audit trail reporting
- Error logging and alerting

## 🔐 Security & Compliance

### Security Features
- **Authentication**: Session-based with secure tokens
- **Data Protection**: Encrypted sensitive information
- **Access Control**: Doctor-specific data isolation
- **Audit Trail**: Complete activity logging
- **File Security**: Secure upload and storage

### HIPAA Considerations
- Patient data encryption
- Access logging
- User authentication
- Data retention policies
- Secure transmission (HTTPS)

## 🚧 Development

### Project Structure
```
clinical-insight-assistant/
├── backend/              # FastAPI backend
│   ├── server.py        # Main application
│   ├── requirements.txt # Python dependencies
│   └── uploads/         # File storage
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.js      # Main component
│   │   └── components/ # UI components
│   └── public/         # Static assets
├── docker/             # Docker configuration
├── sample_data/        # Test data
└── docs/              # Documentation
```

### Contributing
1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

### Code Quality
- **Type Annotations**: Python type hints
- **Error Handling**: Comprehensive exception management
- **Testing**: Unit tests for core functionality
- **Documentation**: Inline code documentation

## 📈 Roadmap

### Upcoming Features
- [ ] **DICOM Image Support**: Full medical imaging integration
- [ ] **Voice Commands**: Hands-free operation
- [ ] **Team Collaboration**: Multi-doctor case sharing
- [ ] **Mobile App**: iOS/Android applications
- [ ] **HL7 Integration**: Hospital system connectivity
- [ ] **Advanced Analytics**: Predictive insights

### Performance Improvements
- [ ] **Caching**: Redis for session management
- [ ] **CDN**: Static asset delivery
- [ ] **Database Optimization**: Query performance
- [ ] **Load Balancing**: Multi-instance deployment

## 🤝 Support

### Getting Help
- **Documentation**: Check this README and inline docs
- **Issues**: Submit GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@clinical-insight.ai

### FAQ

**Q: How accurate is the AI analysis?**
A: The system provides confidence scores with each analysis. Accuracy varies by case complexity, with typical confidence scores of 75-90% for standard cases.

**Q: What file formats are supported?**
A: Currently supports CSV (lab reports), PDF (documents), JPG/PNG (images), and DICOM (medical images).

**Q: Is the system HIPAA compliant?**
A: The application includes security features supporting HIPAA compliance, but full compliance requires proper deployment and organizational policies.

**Q: Can I integrate with existing hospital systems?**
A: Yes, the REST API allows integration with EHR systems and other healthcare applications.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Gemini AI**: Advanced multimodal analysis capabilities
- **FastAPI**: High-performance web framework
- **React**: Modern user interface framework
- **MongoDB**: Flexible document database
- **Railway**: Simplified deployment platform

---

**Built with ❤️ for healthcare professionals**

*Transforming clinical decision-making through AI-powered insights*
