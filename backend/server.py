from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import aiofiles
import base64
import mimetypes
import asyncio
import io

# Import Gemini integration
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

# Import PDF generation
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Clinical Insight Assistant API", version="1.0.0")

# Configure CORS for Railway deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.railway.app",
        "https://*.up.railway.app",
        "*"  # Allow all origins for deployment - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Gemini API key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Define Models
class ClinicalCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_summary: str
    patient_id: Optional[str] = None  # Patient identifier
    patient_name: Optional[str] = None  # Patient name
    patient_age: Optional[int] = None  # Patient age
    patient_gender: Optional[str] = None  # Patient gender
    doctor_id: str = "default_doctor"  # Simple auth for now
    doctor_name: Optional[str] = None  # Doctor name
    uploaded_files: List[Dict[str, Any]] = Field(default_factory=list)
    analysis_result: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicalCaseCreate(BaseModel):
    patient_summary: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    doctor_id: str = "default_doctor"
    doctor_name: Optional[str] = None

class ClinicalAnalysisResult(BaseModel):
    soap_note: Dict[str, str]
    differential_diagnoses: List[Dict[str, Any]]
    treatment_recommendations: List[str]
    investigation_suggestions: List[str]
    file_interpretations: List[Dict[str, str]]
    confidence_score: float
    overall_assessment: str

class RetrievalQuery(BaseModel):
    query: str
    doctor_id: str = "default_doctor"


class CaseFeedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    doctor_id: str
    feedback_type: str  # "positive", "negative"
    feedback_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CaseFeedbackCreate(BaseModel):
    case_id: str
    doctor_id: str = "default_doctor"
    feedback_type: str  # "positive", "negative"
    feedback_text: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    full_name: str
    doctor_id: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    doctor_id: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserProfile(BaseModel):
    full_name: str
    doctor_id: str
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str  # "case_created", "case_viewed", "case_analyzed", "feedback_submitted", "login", "logout"
    resource_id: Optional[str] = None  # case_id, file_id, etc.
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None

class SearchFilters(BaseModel):
    doctor_id: str = "default_doctor"
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    confidence_min: Optional[float] = None
    has_files: Optional[bool] = None
    search_text: Optional[str] = None
async def analyze_individual_files(uploaded_files: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Analyze each uploaded file individually to get per-file interpretations"""
    file_interpretations = []
    
    for file_info in uploaded_files:
        if not os.path.exists(file_info["file_path"]):
            continue
            
        try:
            # Create a new Gemini chat instance for individual file analysis
            session_id = f"file-analysis-{uuid.uuid4()}"
            chat = LlmChat(
                api_key=GEMINI_API_KEY,
                session_id=session_id,
                system_message="""You are a medical file analysis specialist. Analyze the provided medical file and return a structured interpretation.
                
                For lab files (CSV/PDF): Extract and interpret lab values, identify abnormal results, clinical significance.
                For medical images: Describe findings, identify abnormalities, suggest differential diagnoses.
                For text files: Summarize key medical information and clinical relevance.
                
                Respond in JSON format:
                {
                    "file_type": "lab_report|medical_image|text_document",
                    "key_findings": ["finding1", "finding2"],
                    "abnormal_values": ["abnormal1", "abnormal2"],
                    "clinical_significance": "detailed interpretation",
                    "recommendations": ["recommendation1", "recommendation2"]
                }"""
            ).with_model("gemini", "gemini-2.5-pro-preview-05-06").with_max_tokens(4096)
            
            # Analyze the individual file
            file_content = FileContentWithMimeType(
                file_path=file_info["file_path"],
                mime_type=file_info["mime_type"]
            )
            
            analysis_prompt = f"""
            ANALYZE THIS MEDICAL FILE:
            File name: {file_info["original_name"]}
            File type: {file_info["mime_type"]}
            
            Please provide a detailed medical interpretation of this file including:
            1. Key findings
            2. Any abnormal values or concerning features
            3. Clinical significance
            4. Recommendations for follow-up or treatment
            
            Format your response as JSON.
            """
            
            user_message = UserMessage(
                text=analysis_prompt,
                file_contents=[file_content]
            )
            
            response = await chat.send_message(user_message)
            
            # Try to parse JSON response
            try:
                import json
                analysis_data = json.loads(response)
                
                file_interpretation = {
                    "file_name": file_info["original_name"],
                    "file_type": analysis_data.get("file_type", "unknown"),
                    "key_findings": analysis_data.get("key_findings", []),
                    "abnormal_values": analysis_data.get("abnormal_values", []),
                    "clinical_significance": analysis_data.get("clinical_significance", "No specific findings"),
                    "recommendations": analysis_data.get("recommendations", []),
                    "full_interpretation": response[:500]  # Keep full response as backup
                }
            except json.JSONDecodeError:
                # Fallback if response is not JSON
                file_interpretation = {
                    "file_name": file_info["original_name"],
                    "file_type": "analysis_completed",
                    "key_findings": ["See detailed interpretation"],
                    "abnormal_values": [],
                    "clinical_significance": response[:300],
                    "recommendations": ["Review detailed analysis"],
                    "full_interpretation": response[:500]
                }
            
            file_interpretations.append(file_interpretation)
            
        except Exception as e:
            logging.error(f"Error analyzing file {file_info['original_name']}: {str(e)}")
            file_interpretations.append({
                "file_name": file_info["original_name"],
                "file_type": "error",
                "key_findings": ["Analysis failed"],
                "abnormal_values": [],
                "clinical_significance": f"Error in analysis: {str(e)}",
                "recommendations": ["Retry analysis"],
                "full_interpretation": f"Error: {str(e)}"
            })
    
    return file_interpretations

# Authentication Helper Functions
import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${password_hash.hex()}"

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    try:
        salt, hash_hex = password_hash.split('$')
        password_check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return password_check.hex() == hash_hex
    except:
        return False

def create_session_token() -> str:
    """Create a simple session token"""
    return secrets.token_urlsafe(32)

# Audit Trail Helper Functions
async def log_audit_event(user_id: str, action: str, resource_id: Optional[str] = None, 
                         details: Optional[str] = None, ip_address: Optional[str] = None):
    """Log an audit event"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address
        )
        await db.audit_logs.insert_one(audit_log.dict())
    except Exception as e:
        logging.error(f"Failed to log audit event: {str(e)}")

# Simple session storage (in production, use Redis or proper session management)
active_sessions = {}

# PDF Generation Functions
def generate_case_pdf(case: dict) -> BytesIO:
    """Generate PDF report for a clinical case"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        textColor=colors.darkblue
    )
    story.append(Paragraph("Clinical Case Analysis Report", title_style))
    story.append(Spacer(1, 12))
    
    # Case Information
    case_info_style = ParagraphStyle(
        'CaseInfo',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12
    )
    
    story.append(Paragraph(f"<b>Case ID:</b> {case['id']}", case_info_style))
    story.append(Paragraph(f"<b>Created:</b> {case['created_at']}", case_info_style))
    story.append(Paragraph(f"<b>Doctor ID:</b> {case['doctor_id']}", case_info_style))
    story.append(Paragraph(f"<b>Files Uploaded:</b> {len(case.get('uploaded_files', []))}", case_info_style))
    story.append(Spacer(1, 12))
    
    # Patient Summary
    story.append(Paragraph("<b>Patient Summary:</b>", styles['Heading2']))
    story.append(Paragraph(case['patient_summary'], styles['Normal']))
    story.append(Spacer(1, 12))
    
    if case.get('analysis_result'):
        analysis = case['analysis_result']
        
        # SOAP Notes
        story.append(Paragraph("<b>SOAP Notes:</b>", styles['Heading2']))
        soap_data = [
            ['Component', 'Description'],
            ['Subjective', analysis['soap_note'].get('subjective', 'N/A')],
            ['Objective', analysis['soap_note'].get('objective', 'N/A')],
            ['Assessment', analysis['soap_note'].get('assessment', 'N/A')],
            ['Plan', analysis['soap_note'].get('plan', 'N/A')],
        ]
        
        soap_table = Table(soap_data, colWidths=[1.5*inch, 4.5*inch])
        soap_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(soap_table)
        story.append(Spacer(1, 12))
        
        # Differential Diagnoses
        story.append(Paragraph("<b>Differential Diagnoses:</b>", styles['Heading2']))
        for i, diagnosis in enumerate(analysis.get('differential_diagnoses', []), 1):
            story.append(Paragraph(f"{i}. <b>{diagnosis.get('diagnosis', 'Unknown')} ({diagnosis.get('likelihood', 0)}%)</b>", styles['Normal']))
            story.append(Paragraph(f"   Rationale: {diagnosis.get('rationale', 'N/A')}", styles['Normal']))
            story.append(Spacer(1, 6))
        
        # Treatment Recommendations
        story.append(Paragraph("<b>Treatment Recommendations:</b>", styles['Heading2']))
        for i, treatment in enumerate(analysis.get('treatment_recommendations', []), 1):
            story.append(Paragraph(f"{i}. {treatment}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Investigation Suggestions
        story.append(Paragraph("<b>Investigation Suggestions:</b>", styles['Heading2']))
        for i, investigation in enumerate(analysis.get('investigation_suggestions', []), 1):
            story.append(Paragraph(f"{i}. {investigation}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # File Interpretations
        if analysis.get('file_interpretations'):
            story.append(Paragraph("<b>File Interpretations:</b>", styles['Heading2']))
            for interpretation in analysis['file_interpretations']:
                story.append(Paragraph(f"<b>File:</b> {interpretation.get('file_name', 'Unknown')}", styles['Normal']))
                story.append(Paragraph(f"<b>Type:</b> {interpretation.get('file_type', 'Unknown')}", styles['Normal']))
                story.append(Paragraph(f"<b>Key Findings:</b> {', '.join(interpretation.get('key_findings', []))}", styles['Normal']))
                story.append(Paragraph(f"<b>Clinical Significance:</b> {interpretation.get('clinical_significance', 'N/A')}", styles['Normal']))
                story.append(Spacer(1, 6))
        
        # Confidence Score and Overall Assessment
        story.append(Paragraph(f"<b>Confidence Score:</b> {analysis.get('confidence_score', 0)}%", styles['Heading3']))
        story.append(Paragraph("<b>Overall Assessment:</b>", styles['Heading3']))
        story.append(Paragraph(analysis.get('overall_assessment', 'N/A'), styles['Normal']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
async def save_uploaded_file(file: UploadFile) -> Dict[str, Any]:
    """Save uploaded file and return file info"""
    file_id = str(uuid.uuid4())
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    saved_filename = f"{file_id}.{file_extension}"
    file_path = UPLOAD_DIR / saved_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Get file info
    file_info = {
        "id": file_id,
        "original_name": file.filename,
        "saved_name": saved_filename,
        "file_path": str(file_path),
        "file_size": len(content),
        "mime_type": file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream",
        "uploaded_at": datetime.utcnow()
    }
    
    return file_info

async def analyze_clinical_case(case_summary: str, uploaded_files: List[Dict[str, Any]]) -> ClinicalAnalysisResult:
    """Analyze clinical case using Gemini 2.5 Pro with enhanced per-file analysis"""
    try:
        # First, analyze each file individually
        individual_file_interpretations = await analyze_individual_files(uploaded_files)
        
        # Create a new Gemini chat instance for comprehensive analysis
        session_id = f"clinical-analysis-{uuid.uuid4()}"
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message="""You are a clinical AI assistant specialized in analyzing medical data including text reports, lab results, and medical images. 
            
            Your task is to:
            1. Generate comprehensive SOAP notes (Subjective, Objective, Assessment, Plan)
            2. Provide differential diagnoses with likelihood rankings
            3. Recommend treatment plans with evidence-based rationale
            4. Suggest additional investigations if needed
            5. Provide an overall confidence score (0-100)
            6. Synthesize individual file analyses into comprehensive clinical assessment
            
            Always respond in JSON format with the following structure:
            {
                "soap_note": {
                    "subjective": "Patient's reported symptoms and history",
                    "objective": "Observable findings and measurements",
                    "assessment": "Clinical diagnosis and reasoning",
                    "plan": "Treatment and follow-up plan"
                },
                "differential_diagnoses": [
                    {"diagnosis": "Primary diagnosis", "likelihood": 85, "rationale": "Supporting evidence"},
                    {"diagnosis": "Alternative diagnosis", "likelihood": 60, "rationale": "Why considered"}
                ],
                "treatment_recommendations": ["Recommendation 1", "Recommendation 2"],
                "investigation_suggestions": ["Test 1", "Test 2"],
                "confidence_score": 85,
                "overall_assessment": "Comprehensive clinical summary"
            }
            
            Important: This is an AI assistant tool and should not replace professional medical judgment."""
        ).with_model("gemini", "gemini-2.5-flash-preview-04-17").with_max_tokens(8192)
        
        # Prepare files for analysis
        file_contents = []
        for file_info in uploaded_files:
            if os.path.exists(file_info["file_path"]):
                file_content = FileContentWithMimeType(
                    file_path=file_info["file_path"],
                    mime_type=file_info["mime_type"]
                )
                file_contents.append(file_content)
        
        # Create comprehensive analysis prompt including individual file interpretations
        file_summary = "INDIVIDUAL FILE ANALYSES:\n"
        for interp in individual_file_interpretations:
            file_summary += f"""
File: {interp['file_name']}
Type: {interp['file_type']}
Key Findings: {', '.join(interp['key_findings'])}
Clinical Significance: {interp['clinical_significance']}
Recommendations: {', '.join(interp['recommendations'])}
---
"""
        
        analysis_prompt = f"""
        PATIENT CASE SUMMARY:
        {case_summary}
        
        UPLOADED FILES: {len(file_contents)} files attached for analysis
        
        {file_summary}
        
        Please synthesize all the above information to provide a comprehensive clinical analysis:
        1) SOAP notes incorporating all available data
        2) Differential diagnoses with likelihood rankings based on case summary and file findings
        3) Treatment recommendations considering all clinical data
        4) Investigation suggestions based on current findings
        5) Overall confidence score (0-100) considering data quality and clinical complexity
        6) Comprehensive clinical assessment
        
        Consider the individual file analyses when forming your overall assessment.
        Respond in the specified JSON format.
        """
        
        # Send analysis request
        user_message = UserMessage(
            text=analysis_prompt,
            file_contents=file_contents
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response (assuming it's JSON)
        try:
            import json
            import re
            
            # Log the raw response for debugging
            logging.info(f"Raw Gemini response: {response[:200]}...")
            
            # Try to extract JSON from the response if it's wrapped in markdown
            json_match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
            
            # Clean up the JSON string
            json_str = json_str.strip()
            
            analysis_data = json.loads(json_str)
            
            return ClinicalAnalysisResult(
                soap_note=analysis_data.get("soap_note", {
                    "subjective": "No subjective data provided",
                    "objective": "No objective data provided", 
                    "assessment": "Unable to assess",
                    "plan": "No plan available"
                }),
                differential_diagnoses=analysis_data.get("differential_diagnoses", []),
                treatment_recommendations=analysis_data.get("treatment_recommendations", []),
                investigation_suggestions=analysis_data.get("investigation_suggestions", []),
                file_interpretations=individual_file_interpretations,  # Use detailed per-file interpretations
                confidence_score=analysis_data.get("confidence_score", 75),
                overall_assessment=analysis_data.get("overall_assessment", "Clinical analysis completed successfully")
            )
        except (json.JSONDecodeError, AttributeError) as e:
            logging.error(f"JSON parsing error: {str(e)}, Response: {response[:500]}")
            # If response is not JSON, create a basic analysis but include some of the response
            return ClinicalAnalysisResult(
                soap_note={
                    "subjective": "Analysis based on provided case summary",
                    "objective": f"Files analyzed: {len(file_contents)} files",
                    "assessment": "AI-generated clinical assessment",
                    "plan": "See treatment recommendations"
                },
                differential_diagnoses=[{"diagnosis": "Requires further evaluation", "likelihood": 50, "rationale": "Insufficient data for definitive diagnosis"}],
                treatment_recommendations=["Consult with specialist", "Additional diagnostic tests"],
                investigation_suggestions=["Complete history and physical", "Relevant laboratory tests"],
                file_interpretations=individual_file_interpretations,  # Use detailed per-file interpretations
                confidence_score=50,
                overall_assessment=response[:500] if response else "Analysis completed with limited data"
            )
        
    except Exception as e:
        logging.error(f"Error in clinical analysis: {str(e)}")
        # Return basic analysis on error
        return ClinicalAnalysisResult(
            soap_note={
                "subjective": "Error in analysis",
                "objective": "Technical issue occurred",
                "assessment": "Unable to complete analysis",
                "plan": "Please retry analysis"
            },
            differential_diagnoses=[{"diagnosis": "Analysis failed", "likelihood": 0, "rationale": str(e)}],
            treatment_recommendations=["Retry analysis", "Consult healthcare provider"],
            investigation_suggestions=["Technical review required"],
            file_interpretations=[{"file_name": "error", "interpretation": f"Analysis failed: {str(e)}"}],
            confidence_score=0,
            overall_assessment=f"Analysis failed due to technical error: {str(e)}"
        )

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Clinical Insight Assistant API"}

@api_router.post("/cases", response_model=ClinicalCase)
async def create_case(case_data: ClinicalCaseCreate):
    """Create a new clinical case"""
    case_dict = case_data.dict()
    case_obj = ClinicalCase(**case_dict)
    
    # Save to database
    result = await db.clinical_cases.insert_one(case_obj.dict())
    
    # Log audit event
    await log_audit_event(case_data.doctor_id, "case_created", case_obj.id, f"Created case with summary: {case_data.patient_summary[:100]}")
    
    return case_obj

@api_router.post("/cases/{case_id}/upload")
async def upload_files(case_id: str, files: List[UploadFile] = File(...)):
    """Upload files for a clinical case"""
    try:
        # Find the case
        case = await db.clinical_cases.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Save uploaded files
        uploaded_files = []
        for file in files:
            file_info = await save_uploaded_file(file)
            uploaded_files.append(file_info)
        
        # Update case with uploaded files
        case["uploaded_files"].extend(uploaded_files)
        case["updated_at"] = datetime.utcnow()
        
        await db.clinical_cases.update_one(
            {"id": case_id},
            {"$set": case}
        )
        
        return {"message": f"Uploaded {len(files)} files successfully", "files": uploaded_files}
        
    except Exception as e:
        logging.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Authentication Endpoints
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if username already exists
        existing_user = await db.users.find_one({"username": user_data.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Check if doctor_id already exists
        existing_doctor = await db.users.find_one({"doctor_id": user_data.doctor_id})
        if existing_doctor:
            raise HTTPException(status_code=400, detail="Doctor ID already exists")
        
        # Create user
        password_hash = hash_password(user_data.password)
        user_dict = user_data.dict()
        del user_dict["password"]  # Remove plain password
        user_dict["password_hash"] = password_hash
        
        user_obj = User(**user_dict)
        await db.users.insert_one(user_obj.dict())
        
        # Log audit event
        await log_audit_event(user_obj.id, "user_registered", details=f"User {user_data.username} registered")
        
        return user_obj
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    """Login user and create session"""
    try:
        # Find user
        user = await db.users.find_one({"username": login_data.username})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Verify password
        if not verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Create session token
        session_token = create_session_token()
        active_sessions[session_token] = {
            "user_id": user["id"],
            "username": user["username"],
            "created_at": datetime.utcnow()
        }
        
        # Update last login
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Log audit event
        await log_audit_event(user["id"], "login", details=f"User {login_data.username} logged in")
        
        return {
            "message": "Login successful",
            "session_token": session_token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "email": user["email"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/logout")
async def logout_user(session_token: str):
    """Logout user and destroy session"""
    try:
        if session_token in active_sessions:
            user_info = active_sessions[session_token]
            del active_sessions[session_token]
            
            # Log audit event
            await log_audit_event(user_info["user_id"], "logout", details=f"User {user_info['username']} logged out")
            
            return {"message": "Logout successful"}
        else:
            raise HTTPException(status_code=401, detail="Invalid session")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/verify")
async def verify_session(session_token: str):
    """Verify session token and return user info"""
    try:
        if session_token not in active_sessions:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        user_info = active_sessions[session_token]
        
        # Get full user details
        user = await db.users.find_one({"id": user_info["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "valid": True,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "full_name": user["full_name"],
                "email": user["email"],
                "doctor_id": user.get("doctor_id", ""),
                "specialty": user.get("specialty", ""),
                "license_number": user.get("license_number", ""),
                "hospital_affiliation": user.get("hospital_affiliation", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Session verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/auth/profile")
async def update_profile(profile_data: UserProfile, session_token: str):
    """Update user profile"""
    try:
        # Verify session
        if session_token not in active_sessions:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        user_info = active_sessions[session_token]
        user_id = user_info["user_id"]
        
        # Check if new doctor_id conflicts with existing users (if changed)
        existing_user = await db.users.find_one({"id": user_id})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if existing_user.get("doctor_id") != profile_data.doctor_id:
            doctor_id_exists = await db.users.find_one({
                "doctor_id": profile_data.doctor_id,
                "id": {"$ne": user_id}
            })
            if doctor_id_exists:
                raise HTTPException(status_code=400, detail="Doctor ID already exists")
        
        # Update profile
        update_data = profile_data.dict()
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        # Log audit event
        await log_audit_event(user_id, "profile_updated", details="Profile information updated")
        
        # Get updated user data
        updated_user = await db.users.find_one({"id": user_id})
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user["id"],
                "username": updated_user["username"],
                "full_name": updated_user["full_name"],
                "email": updated_user["email"],
                "doctor_id": updated_user.get("doctor_id", ""),
                "specialty": updated_user.get("specialty", ""),
                "license_number": updated_user.get("license_number", ""),
                "hospital_affiliation": updated_user.get("hospital_affiliation", "")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Audit Trail Endpoints
@api_router.get("/audit/logs")
async def get_audit_logs(user_id: Optional[str] = None, action: Optional[str] = None, limit: int = 100):
    """Get audit logs (admin functionality)"""
    try:
        query = {}
        if user_id:
            query["user_id"] = user_id
        if action:
            query["action"] = action
        
        logs = await db.audit_logs.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
        
        # Convert datetime objects for serialization
        for log in logs:
            if "_id" in log:
                del log["_id"]
            if "timestamp" in log and hasattr(log["timestamp"], "isoformat"):
                log["timestamp"] = log["timestamp"].isoformat()
        
        return {"logs": logs, "total": len(logs)}
        
    except Exception as e:
        logging.error(f"Audit logs error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/audit/user/{user_id}")
async def get_user_audit_trail(user_id: str):
    """Get audit trail for a specific user"""
    try:
        logs = await db.audit_logs.find({"user_id": user_id}).sort("timestamp", -1).to_list(100)
        
        # Convert datetime objects for serialization
        for log in logs:
            if "_id" in log:
                del log["_id"]
            if "timestamp" in log and hasattr(log["timestamp"], "isoformat"):
                log["timestamp"] = log["timestamp"].isoformat()
        
        return {"user_id": user_id, "logs": logs, "total": len(logs)}
        
    except Exception as e:
        logging.error(f"User audit trail error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# PDF Export Endpoint
@api_router.get("/cases/{case_id}/export-pdf")
async def export_case_pdf(case_id: str):
    """Export case to PDF"""
    try:
        # Find the case
        case = await db.clinical_cases.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Convert datetime objects to strings for PDF generation
        if "created_at" in case and hasattr(case["created_at"], "strftime"):
            case["created_at"] = case["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        if "updated_at" in case and hasattr(case["updated_at"], "strftime"):
            case["updated_at"] = case["updated_at"].strftime("%Y-%m-%d %H:%M:%S")
        
        # Generate PDF
        pdf_buffer = generate_case_pdf(case)
        
        # Log audit event
        await log_audit_event(case.get("doctor_id", "unknown"), "case_exported", case_id, "Case exported to PDF")
        
        # Return PDF as response
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            io.BytesIO(pdf_buffer.read()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=case_{case_id[:8]}_report.pdf"}
        )
        
    except Exception as e:
        logging.error(f"PDF export error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/cases/{case_id}/analyze")
async def analyze_case(case_id: str):
    """Analyze a clinical case with uploaded files"""
    try:
        # Find the case
        case = await db.clinical_cases.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Perform clinical analysis
        analysis_result = await analyze_clinical_case(
            case["patient_summary"], 
            case.get("uploaded_files", [])
        )
        
        # Update case with analysis result
        case["analysis_result"] = analysis_result.dict()
        case["confidence_score"] = analysis_result.confidence_score
        case["updated_at"] = datetime.utcnow()
        
        await db.clinical_cases.update_one(
            {"id": case_id},
            {"$set": case}
        )
        
        return analysis_result
        
    except Exception as e:
        logging.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cases", response_model=List[ClinicalCase])
async def get_cases(doctor_id: str = "default_doctor"):
    """Get all cases for a doctor"""
    cases = await db.clinical_cases.find({"doctor_id": doctor_id}).sort("created_at", -1).to_list(100)
    return [ClinicalCase(**case) for case in cases]

@api_router.get("/cases/{case_id}", response_model=ClinicalCase)
async def get_case(case_id: str):
    """Get a specific case"""
    case = await db.clinical_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return ClinicalCase(**case)

@api_router.post("/query")
async def query_cases(query_data: RetrievalQuery):
    """Handle natural language queries about cases with enhanced command parsing"""
    try:
        import re
        from datetime import datetime, timedelta
        
        # Enhanced query processing with better pattern matching
        query_lower = query_data.query.lower()
        doctor_id = query_data.doctor_id
        
        # Initialize response components
        cases_found = []
        response_text = ""
        
        # Enhanced pattern matching for different query types
        patterns = {
            # Date patterns
            'yesterday': r'\b(yesterday|last\s*day)\b',
            'today': r'\b(today|this\s*day)\b',
            'last_week': r'\b(last\s*week|past\s*week)\b',
            'last_month': r'\b(last\s*month|past\s*month)\b',
            
            # Test type patterns
            'cbc': r'\b(cbc|complete\s*blood\s*count|blood\s*count)\b',
            'xray': r'\b(x-?ray|xray|chest\s*x-?ray|radiograph)\b',
            'ct_scan': r'\b(ct\s*scan|computed\s*tomography|cat\s*scan)\b',
            'mri': r'\b(mri|magnetic\s*resonance)\b',
            'lab': r'\b(lab|laboratory|blood\s*test|lab\s*result)\b',
            
            # Patient ID patterns
            'patient_id': r'\b(?:patient|id|case)\s*(?:#|id|number)?\s*(\d+)\b',
            
            # General patterns
            'summary': r'\b(summary|report|result|finding)\b',
            'analysis': r'\b(analysis|interpret|analyze|diagnos)\b'
        }
        
        # Extract patient ID if present
        patient_id_match = re.search(patterns['patient_id'], query_lower)
        patient_id = patient_id_match.group(1) if patient_id_match else None
        
        # Determine date range
        date_filter = {}
        current_date = datetime.utcnow()
        
        if re.search(patterns['yesterday'], query_lower):
            yesterday = current_date - timedelta(days=1)
            date_filter = {
                "created_at": {
                    "$gte": yesterday.replace(hour=0, minute=0, second=0, microsecond=0),
                    "$lt": yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
                }
            }
            response_text += "Searching yesterday's cases. "
            
        elif re.search(patterns['today'], query_lower):
            today = current_date
            date_filter = {
                "created_at": {
                    "$gte": today.replace(hour=0, minute=0, second=0, microsecond=0),
                    "$lt": today.replace(hour=23, minute=59, second=59, microsecond=999999)
                }
            }
            response_text += "Searching today's cases. "
            
        elif re.search(patterns['last_week'], query_lower):
            last_week = current_date - timedelta(days=7)
            date_filter = {
                "created_at": {"$gte": last_week}
            }
            response_text += "Searching last week's cases. "
            
        elif re.search(patterns['last_month'], query_lower):
            last_month = current_date - timedelta(days=30)
            date_filter = {
                "created_at": {"$gte": last_month}
            }
            response_text += "Searching last month's cases. "
        
        # Build query filter
        query_filter = {"doctor_id": doctor_id}
        query_filter.update(date_filter)
        
        # Add patient ID filter if specified
        if patient_id:
            query_filter["patient_id"] = patient_id
            response_text += f"Looking for patient ID {patient_id}. "
        
        # Search cases
        cases_cursor = db.clinical_cases.find(query_filter).sort("created_at", -1)
        cases_found = await cases_cursor.to_list(50)  # Limit to 50 cases
        
        if not cases_found:
            return {
                "response": f"No cases found matching your query: '{query_data.query}'. Try different search terms or check if the patient ID exists.",
                "cases_found": 0,
                "cases": []
            }
        
        # Determine what information to extract based on query intent
        filtered_results = []
        
        for case in cases_found:
            case_info = {
                "id": case["id"],
                "patient_id": case.get("patient_id", "N/A"),
                "patient_name": case.get("patient_name", "N/A"),
                "created_at": case["created_at"].isoformat() if hasattr(case["created_at"], "isoformat") else str(case["created_at"]),
                "patient_summary": case["patient_summary"][:200] + "..." if len(case["patient_summary"]) > 200 else case["patient_summary"],
                "uploaded_files": len(case.get("uploaded_files", [])),
                "confidence_score": case.get("confidence_score", 0)
            }
            
            # Add specific information based on query type
            if re.search(patterns['cbc'], query_lower) or re.search(patterns['lab'], query_lower):
                # Look for lab-related files and results
                lab_files = [f for f in case.get("uploaded_files", []) if "csv" in f.get("mime_type", "").lower() or "lab" in f.get("original_name", "").lower()]
                case_info["lab_files"] = len(lab_files)
                
                if case.get("analysis_result") and case["analysis_result"].get("file_interpretations"):
                    lab_interpretations = [fi for fi in case["analysis_result"]["file_interpretations"] 
                                         if "lab" in fi.get("file_type", "").lower() or "cbc" in fi.get("clinical_significance", "").lower()]
                    case_info["lab_findings"] = [li.get("clinical_significance", "")[:100] for li in lab_interpretations]
            
            elif re.search(patterns['xray'], query_lower) or re.search(patterns['ct_scan'], query_lower) or re.search(patterns['mri'], query_lower):
                # Look for imaging files and results
                image_files = [f for f in case.get("uploaded_files", []) if any(img_type in f.get("mime_type", "").lower() for img_type in ["image", "dicom"])]
                case_info["image_files"] = len(image_files)
                
                if case.get("analysis_result") and case["analysis_result"].get("file_interpretations"):
                    image_interpretations = [fi for fi in case["analysis_result"]["file_interpretations"] 
                                           if "image" in fi.get("file_type", "").lower() or "radiolog" in fi.get("clinical_significance", "").lower()]
                    case_info["imaging_findings"] = [ii.get("clinical_significance", "")[:100] for ii in image_interpretations]
            
            # Add analysis summary if available
            if case.get("analysis_result"):
                case_info["has_analysis"] = True
                if re.search(patterns['summary'], query_lower):
                    case_info["overall_assessment"] = case["analysis_result"].get("overall_assessment", "")[:200]
                if re.search(patterns['analysis'], query_lower):
                    case_info["differential_diagnoses"] = [dd.get("diagnosis", "") for dd in case["analysis_result"].get("differential_diagnoses", [])][:3]
            else:
                case_info["has_analysis"] = False
            
            filtered_results.append(case_info)
        
        # Generate response text based on findings
        if len(filtered_results) == 1:
            case = filtered_results[0]
            response_text += f"Found 1 case for patient {case['patient_id']} ({case['patient_name']}) created on {case['created_at'][:10]}. "
            
            if 'lab_findings' in case and case['lab_findings']:
                response_text += f"Lab findings: {'; '.join(case['lab_findings'])}. "
            elif 'imaging_findings' in case and case['imaging_findings']:
                response_text += f"Imaging findings: {'; '.join(case['imaging_findings'])}. "
            elif case['has_analysis']:
                response_text += f"Analysis available with confidence score {case['confidence_score']}%. "
            
        else:
            response_text += f"Found {len(filtered_results)} cases matching your criteria. "
            
            # Summary statistics
            total_with_analysis = sum(1 for c in filtered_results if c['has_analysis'])
            total_files = sum(c['uploaded_files'] for c in filtered_results)
            avg_confidence = sum(c['confidence_score'] for c in filtered_results if c['confidence_score'] > 0) / max(1, total_with_analysis)
            
            response_text += f"{total_with_analysis} cases have completed analysis, {total_files} total files uploaded, average confidence score: {avg_confidence:.1f}%. "
        
        return {
            "response": response_text.strip(),
            "cases_found": len(filtered_results),
            "cases": filtered_results,
            "query_interpretation": {
                "patient_id": patient_id,
                "date_range": "yesterday" if "yesterday" in response_text else "today" if "today" in response_text else "all",
                "query_type": "lab" if re.search(patterns['lab'], query_lower) else "imaging" if re.search(patterns['xray'], query_lower) else "general"
            }
        }
        
    except Exception as e:
        logging.error(f"Query processing error: {str(e)}")
        return {
            "response": f"Sorry, I encountered an error processing your query: {str(e)}. Please try rephrasing your request.",
            "cases_found": 0,
            "cases": []
        }

@api_router.post("/cases/{case_id}/feedback", response_model=CaseFeedback)
async def submit_feedback(case_id: str, feedback_data: CaseFeedbackCreate):
    """Submit feedback for a case analysis"""
    try:
        # Verify case exists
        case = await db.clinical_cases.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        # Create feedback
        feedback_dict = feedback_data.dict()
        feedback_dict["case_id"] = case_id
        feedback_obj = CaseFeedback(**feedback_dict)
        
        # Save to database
        await db.case_feedback.insert_one(feedback_obj.dict())
        
        return feedback_obj
        
    except Exception as e:
        logging.error(f"Feedback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/feedback/stats")
async def get_feedback_stats(doctor_id: str = "default_doctor"):
    """Get feedback statistics for the dashboard"""
    try:
        # Count positive and negative feedback
        positive_count = await db.case_feedback.count_documents({
            "doctor_id": doctor_id,
            "feedback_type": "positive"
        })
        
        negative_count = await db.case_feedback.count_documents({
            "doctor_id": doctor_id,
            "feedback_type": "negative"
        })
        
        total_feedback = positive_count + negative_count
        satisfaction_rate = (positive_count / total_feedback * 100) if total_feedback > 0 else 0
        
        return {
            "positive_feedback": positive_count,
            "negative_feedback": negative_count,
            "total_feedback": total_feedback,
            "satisfaction_rate": round(satisfaction_rate, 2)
        }
        
    except Exception as e:
        logging.error(f"Feedback stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/cases/search")
async def advanced_search(filters: SearchFilters):
    """Advanced search and filtering for cases"""
    try:
        # Build MongoDB query
        mongo_query = {"doctor_id": filters.doctor_id}
        
        # Date range filter
        if filters.date_from or filters.date_to:
            date_filter = {}
            if filters.date_from:
                from datetime import datetime
                date_filter["$gte"] = datetime.fromisoformat(filters.date_from)
            if filters.date_to:
                from datetime import datetime
                date_filter["$lte"] = datetime.fromisoformat(filters.date_to)
            mongo_query["created_at"] = date_filter
        
        # Confidence score filter
        if filters.confidence_min is not None:
            mongo_query["confidence_score"] = {"$gte": filters.confidence_min}
        
        # Files filter
        if filters.has_files is not None:
            if filters.has_files:
                mongo_query["uploaded_files"] = {"$ne": [], "$exists": True}
            else:
                mongo_query["$or"] = [
                    {"uploaded_files": {"$size": 0}},
                    {"uploaded_files": {"$exists": False}}
                ]
        
        # Text search
        if filters.search_text:
            text_regex = {"$regex": filters.search_text, "$options": "i"}
            mongo_query["$or"] = [
                {"patient_summary": text_regex},
                {"analysis_result.overall_assessment": text_regex},
                {"analysis_result.soap_note.subjective": text_regex},
                {"analysis_result.soap_note.assessment": text_regex}
            ]
        
        # Execute search
        cases = await db.clinical_cases.find(mongo_query).sort("created_at", -1).to_list(100)
        
        # Convert to serializable format
        serializable_cases = []
        for case in cases:
            if "_id" in case:
                del case["_id"]
            
            # Convert datetime objects
            if "created_at" in case and hasattr(case["created_at"], "isoformat"):
                case["created_at"] = case["created_at"].isoformat()
            if "updated_at" in case and hasattr(case["updated_at"], "isoformat"):
                case["updated_at"] = case["updated_at"].isoformat()
                
            # Convert file upload dates
            for file_info in case.get("uploaded_files", []):
                if "uploaded_at" in file_info and hasattr(file_info["uploaded_at"], "isoformat"):
                    file_info["uploaded_at"] = file_info["uploaded_at"].isoformat()
            
            serializable_cases.append(case)
        
        return {
            "cases": serializable_cases,
            "total_found": len(serializable_cases),
            "filters_applied": filters.dict()
        }
        
    except Exception as e:
        logging.error(f"Advanced search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()