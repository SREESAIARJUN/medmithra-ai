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

# Import Gemini integration
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

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
    doctor_id: str = "default_doctor"  # Simple auth for now
    uploaded_files: List[Dict[str, Any]] = Field(default_factory=list)
    analysis_result: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicalCaseCreate(BaseModel):
    patient_summary: str
    doctor_id: str = "default_doctor"

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

# Helper Functions
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
    """Analyze clinical case using Gemini 2.5 Pro"""
    try:
        # Create a new Gemini chat instance for this analysis
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
            5. Interpret uploaded medical files (lab reports, images, etc.)
            6. Provide an overall confidence score (0-100)
            
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
                "file_interpretations": [
                    {"file_name": "filename", "interpretation": "detailed analysis"}
                ],
                "confidence_score": 85,
                "overall_assessment": "Comprehensive clinical summary"
            }
            
            Important: This is an AI assistant tool and should not replace professional medical judgment."""
        ).with_model("gemini", "gemini-2.5-pro-preview-05-06").with_max_tokens(8192)
        
        # Prepare files for analysis
        file_contents = []
        for file_info in uploaded_files:
            if os.path.exists(file_info["file_path"]):
                file_content = FileContentWithMimeType(
                    file_path=file_info["file_path"],
                    mime_type=file_info["mime_type"]
                )
                file_contents.append(file_content)
        
        # Create comprehensive analysis prompt
        analysis_prompt = f"""
        PATIENT CASE SUMMARY:
        {case_summary}
        
        UPLOADED FILES: {len(file_contents)} files attached for analysis
        
        Please analyze this patient's complete medical data including the case summary and all uploaded files. 
        Generate a comprehensive clinical analysis with:
        1) SOAP notes
        2) Differential diagnoses with likelihood rankings
        3) Treatment recommendations with rationale
        4) Investigation suggestions
        5) Interpretation of each uploaded file
        6) Overall confidence score (0-100)
        7) Comprehensive clinical assessment
        
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
            analysis_data = json.loads(response)
            
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
                file_interpretations=analysis_data.get("file_interpretations", []),
                confidence_score=analysis_data.get("confidence_score", 0),
                overall_assessment=analysis_data.get("overall_assessment", response[:500])
            )
        except json.JSONDecodeError:
            # If response is not JSON, create a basic analysis
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
                file_interpretations=[{"file_name": "all_files", "interpretation": response[:200]}],
                confidence_score=50,
                overall_assessment=response[:500]
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
    """Handle natural language queries about cases"""
    try:
        # Simple query processing for now
        query_lower = query_data.query.lower()
        
        # Search cases by patient summary or analysis results
        cases = await db.clinical_cases.find({
            "doctor_id": query_data.doctor_id,
            "$or": [
                {"patient_summary": {"$regex": query_lower, "$options": "i"}},
                {"analysis_result.overall_assessment": {"$regex": query_lower, "$options": "i"}}
            ]
        }).to_list(10)
        
        if not cases:
            return {"response": "No matching cases found for your query."}
        
        # Format response
        response_text = f"Found {len(cases)} matching cases:\n"
        for case in cases[:3]:  # Show top 3
            response_text += f"- Case from {case['created_at'].strftime('%Y-%m-%d')}: {case['patient_summary'][:100]}...\n"
        
        return {"response": response_text, "cases": cases}
        
    except Exception as e:
        logging.error(f"Query error: {str(e)}")
        return {"response": f"Error processing query: {str(e)}"}

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