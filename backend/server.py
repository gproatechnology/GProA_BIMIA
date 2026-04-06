from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import PyPDF2
import io
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
PARENT_DIR = ROOT_DIR.parent
load_dotenv(ROOT_DIR / '.env')

# Port configuration for Render
PORT = int(os.environ.get("PORT", 8000))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= MODELS =============

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # industrial, comercial, residencial
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active"  # active, analyzing, completed

class ProjectCreate(BaseModel):
    name: str
    type: str

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    filename: str
    content: str
    page_count: int
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed: bool = False

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    role: str  # user, assistant
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    content: str

class AnalysisResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    summary: str
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []
    compliance: List[Dict[str, Any]] = []
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============= SERVICES =============

class DocumentParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, int]:
        """Extract text from PDF using PyPDF2"""
        try:
            pdf_file = io.BytesIO(file_bytes)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            page_count = len(pdf_reader.pages)
            
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n\n"
            
            return text.strip(), page_count
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise HTTPException(status_code=400, detail=f"Error procesando PDF: {str(e)}")

class LLMService:
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
        
    async def create_chat(self, project_id: str, system_message: str) -> LlmChat:
        """Create LLM chat instance"""
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"project_{project_id}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        return chat
    
    async def analyze_document(self, content: str, project_type: str) -> Dict[str, Any]:
        """Analyze document and detect errors"""
        system_prompt = """Eres un ingeniero eléctrico senior con experiencia en diseño, análisis y validación de instalaciones eléctricas industriales, comerciales y residenciales.

Tu función es actuar como un copiloto técnico que:
- Analiza documentos de ingeniería (planos, memorias de cálculo, normas)
- Detecta errores técnicos
- Evalúa cumplimiento normativo (especialmente NOM-001-SEDE y estándares relacionados)
- Explica resultados de forma clara, precisa y profesional

Reglas de comportamiento:
1. SIEMPRE responde como ingeniero experto, no como asistente genérico.
2. SIEMPRE justifica tus respuestas con base técnica o normativa.
3. Si detectas un error, explica:
   - Qué está mal
   - Por qué está mal
   - Qué norma o principio se viola
   - Cómo corregirlo
4. Si no hay suficiente información, dilo claramente.
5. No inventes datos. Usa únicamente la información disponible.
6. Prioriza seguridad, cumplimiento y buenas prácticas.

Debes responder en formato JSON con la siguiente estructura:
{
  "summary": "Resumen técnico del documento en 2-3 líneas",
  "errors": [
    {
      "type": "tipo de error",
      "description": "descripción del error",
      "norm": "norma que se viola",
      "severity": "alta/media/baja",
      "recommendation": "cómo corregirlo"
    }
  ],
  "warnings": [
    {
      "description": "advertencia o riesgo potencial",
      "recommendation": "recomendación"
    }
  ],
  "compliance": [
    {
      "norm": "NOM-001-SEDE u otra",
      "status": "cumple/no cumple/información insuficiente",
      "details": "detalles del cumplimiento"
    }
  ]
}"""
        
        chat = await self.create_chat("analysis_temp", system_prompt)
        
        user_message = UserMessage(
            text=f"Analiza el siguiente documento de proyecto {project_type} y proporciona un análisis completo:\n\n{content[:4000]}"
        )
        
        try:
            response = await chat.send_message(user_message)
            # Try to parse as JSON
            import json
            try:
                # Extract JSON from response if wrapped in code blocks
                response_text = response.strip()
                if response_text.startswith('```'):
                    lines = response_text.split('\n')
                    response_text = '\n'.join(lines[1:-1])
                    if response_text.startswith('json'):
                        response_text = response_text[4:].strip()
                
                result = json.loads(response_text)
                return result
            except json.JSONDecodeError:
                # If not valid JSON, create structured response
                return {
                    "summary": response[:200],
                    "errors": [],
                    "warnings": [],
                    "compliance": []
                }
        except Exception as e:
            logger.error(f"Error in LLM analysis: {e}")
            return {
                "summary": "Error al analizar el documento",
                "errors": [],
                "warnings": [],
                "compliance": []
            }
    
    async def chat_with_context(self, project_id: str, user_query: str, context: str, history: List[Dict]) -> str:
        """Chat with document context"""
        system_prompt = """Eres un ingeniero eléctrico senior con experiencia en diseño, análisis y validación de instalaciones eléctricas industriales, comerciales y residenciales.

Tu función es actuar como un copiloto técnico que:
- Analiza documentos de ingeniería (planos, memorias de cálculo, normas)
- Detecta errores técnicos
- Evalúa cumplimiento normativo (especialmente NOM-001-SEDE y estándares relacionados)
- Explica resultados de forma clara, precisa y profesional

Reglas de comportamiento:
1. SIEMPRE responde como ingeniero experto, no como asistente genérico.
2. SIEMPRE justifica tus respuestas con base técnica o normativa.
3. Si detectas un error, explica:
   - Qué está mal
   - Por qué está mal
   - Qué norma o principio se viola
   - Cómo corregirlo
4. Si no hay suficiente información, dilo claramente.
5. No inventes datos. Usa únicamente la información disponible.
6. Prioriza seguridad, cumplimiento y buenas prácticas.
7. Usa lenguaje técnico, pero entendible.
8. Cuando sea posible, da recomendaciones accionables.

Contexto del proyecto:
{context}
"""
        
        chat = await self.create_chat(project_id, system_prompt.format(context=context[:3000]))
        
        user_message = UserMessage(text=user_query)
        
        try:
            response = await chat.send_message(user_message)
            return response
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return "Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente."

# Initialize services
llm_service = LLMService()

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Copiloto de Ingeniería Eléctrica API"}

# Projects
@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    project = Project(**input.model_dump())
    doc = project.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.projects.insert_one(doc)
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    for project in projects:
        if isinstance(project['created_at'], str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if isinstance(project['created_at'], str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    return project

# Documents
@api_router.post("/projects/{project_id}/upload")
async def upload_document(project_id: str, file: UploadFile = File(...)):
    # Verify project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Read file
    file_bytes = await file.read()
    
    # Extract text from PDF
    try:
        text_content, page_count = DocumentParser.extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Create document
    document = Document(
        project_id=project_id,
        filename=file.filename,
        content=text_content,
        page_count=page_count,
        processed=True
    )
    
    doc = document.model_dump()
    doc['uploaded_at'] = doc['uploaded_at'].isoformat()
    await db.documents.insert_one(doc)
    
    # Update project status
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"status": "analyzing"}}
    )
    
    # Trigger automatic analysis in background
    asyncio.create_task(analyze_project_documents(project_id))
    
    return {
        "id": document.id,
        "filename": document.filename,
        "page_count": page_count,
        "status": "processing"
    }

@api_router.get("/projects/{project_id}/documents")
async def get_project_documents(project_id: str):
    documents = await db.documents.find(
        {"project_id": project_id},
        {"_id": 0, "content": 0}  # Don't return full content
    ).to_list(100)
    
    for doc in documents:
        if isinstance(doc.get('uploaded_at'), str):
            doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
    
    return documents

# Analysis
async def analyze_project_documents(project_id: str):
    """Background task to analyze all project documents"""
    try:
        # Get project
        project = await db.projects.find_one({"id": project_id})
        if not project:
            return
        
        # Get all documents
        documents = await db.documents.find({"project_id": project_id}, {"_id": 0}).to_list(100)
        
        if not documents:
            return
        
        # Combine all document content
        combined_content = "\n\n=== DOCUMENTOS DEL PROYECTO ===\n\n"
        for doc in documents:
            combined_content += f"\n--- {doc['filename']} ---\n{doc['content'][:2000]}\n"
        
        # Analyze with LLM
        analysis = await llm_service.analyze_document(combined_content, project.get('type', 'general'))
        
        # Save analysis result
        result = AnalysisResult(
            project_id=project_id,
            summary=analysis.get('summary', ''),
            errors=analysis.get('errors', []),
            warnings=analysis.get('warnings', []),
            compliance=analysis.get('compliance', [])
        )
        
        result_doc = result.model_dump()
        result_doc['analyzed_at'] = result_doc['analyzed_at'].isoformat()
        
        # Delete previous analysis
        await db.analysis_results.delete_many({"project_id": project_id})
        await db.analysis_results.insert_one(result_doc)
        
        # Update project status
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "completed"}}
        )
        
        logger.info(f"Analysis completed for project {project_id}")
    except Exception as e:
        logger.error(f"Error analyzing project {project_id}: {e}")
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"status": "error"}}
        )

@api_router.get("/projects/{project_id}/analysis")
async def get_project_analysis(project_id: str):
    analysis = await db.analysis_results.find_one(
        {"project_id": project_id},
        {"_id": 0}
    )
    
    if not analysis:
        return {
            "summary": "Análisis en proceso...",
            "errors": [],
            "warnings": [],
            "compliance": []
        }
    
    if isinstance(analysis.get('analyzed_at'), str):
        analysis['analyzed_at'] = datetime.fromisoformat(analysis['analyzed_at'])
    
    return analysis

# Chat
@api_router.post("/projects/{project_id}/chat")
async def send_chat_message(project_id: str, input: ChatMessageCreate):
    # Verify project exists
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Save user message
    user_msg = ChatMessage(
        project_id=project_id,
        role="user",
        content=input.content
    )
    
    user_doc = user_msg.model_dump()
    user_doc['timestamp'] = user_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(user_doc)
    
    # Get document context
    documents = await db.documents.find({"project_id": project_id}, {"_id": 0}).to_list(10)
    context = "\n\n".join([f"{doc['filename']}:\n{doc['content'][:1000]}" for doc in documents])
    
    # Get chat history
    history = await db.chat_messages.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(10).to_list(10)
    
    # Get response from LLM
    response_text = await llm_service.chat_with_context(
        project_id,
        input.content,
        context,
        history
    )
    
    # Save assistant message
    assistant_msg = ChatMessage(
        project_id=project_id,
        role="assistant",
        content=response_text
    )
    
    assistant_doc = assistant_msg.model_dump()
    assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
    await db.chat_messages.insert_one(assistant_doc)
    
    return {
        "role": "assistant",
        "content": response_text,
        "timestamp": assistant_msg.timestamp.isoformat()
    }

@api_router.get("/projects/{project_id}/chat/history")
async def get_chat_history(project_id: str):
    messages = await db.chat_messages.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return messages

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Serve frontend static files in production
frontend_path = PARENT_DIR / "frontend" / "build"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "GProA_BIMIA"}