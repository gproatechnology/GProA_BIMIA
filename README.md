# 🤖 Copiloto de Ingeniería Eléctrica - GProA

Sistema inteligente de análisis de proyectos eléctricos con IA, basado en TwinKnowledge para validación normativa y detección de errores.

![Status](https://img.shields.io/badge/status-Activo-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![React](https://img.shields.io/badge/React-18+-61DAFB)

---

## 📋 Descripción

**GProA_BIMIA** es un sistema de copiloto de IA especializado en ingeniería eléctrica que:

- ✅ Analiza documentos técnicos (PDFs, memorias de cálculo, planos)
- ✅ Detecta errores eléctricos y violaciones normativas
- ✅ Evalúa cumplimiento con NOM-001-SEDE
- ✅ Actúa como ingeniero eléctrico senior
- ✅ Proporciona recomendaciones técnicas accionables

---

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Tailwind)"]
        UI[Dashboard UI]
        PW[Project Workspace]
        Chat[Copiloto Chat]
    end

    subgraph Server["Backend (FastAPI)"]
        API[API Routes]
        DP[Document Parser]
        AS[Analysis Service]
        CS[Chat Service]
    end

    subgraph Data["Capa de Datos (MongoDB)"]
        Proj[Projects]
        Docs[Documents]
        Anal[Analysis Results]
        Msgs[Chat Messages]
    end

    subgraph AI["Servicios IA"]
        LLM[GPT-5.2 / Emergent]
        RAG[Contexto RAG]
    end

    UI --> API
    PW --> DP
    Chat --> CS
    API --> Proj
    API --> Docs
    API --> Anal
    API --> Msgs
    AS --> LLM
    CS --> RAG
    RAG --> LLM
```

---

## 🔄 Flujo de Trabajo

```mermaid
sequenceDiagram
    participant User as Usuario
    participant FE as Frontend
    participant API as Backend
    participant DB as MongoDB
    participant LLM as IA (GPT-5.2)

    User->>FE: Crea Proyecto
    FE->>API: POST /api/projects
    API->>DB: Guardar proyecto
    DB-->>API: Proyecto creado
    API-->>FE: Confirmación

    User->>FE: Sube documento PDF
    FE->>API: POST /upload
    API->>DP: Extraer texto (PyPDF2)
    DP-->>API: Texto extraído
    API->>DB: Guardar documento
    API->>DB: Actualizar estado (analyzing)
    API->>LLM: Solicitar análisis
    
    par Análisis en paralelo
        LLM-->>API: Respuesta análisis
        API->>DB: Guardar resultados
        API->>DB: Actualizar estado (completed)
    end
    
    API-->>FE: Resultados análisis

    User->>FE: Envía pregunta
    FE->>API: POST /chat
    API->>DB: Obtener contexto
    API->>LLM: Consulta con RAG
    LLM-->>API: Respuesta
    API->>DB: Guardar conversación
    API-->>FE: Respuesta del copiloto
```

---

## 🗂️ Estructura del Proyecto

```
GProA_BIMIA/
├── backend/
│   ├── server.py          # API FastAPI completa
│   ├── requirements.txt   # Dependencias Python
│   └── .env              # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── App.js        # Componentes React
│   │   ├── App.css      # Estilos
│   │   └── components/  # Componentes UI (Shadcn)
│   ├── package.json
│   └── public/
├── tests/
│   └── __init__.py
├── memory/
└── test_reports/
```

---

## 🛠️ Stack Tecnológico

```mermaid
graph LR
    subgraph Frontend
        R[React 18]
        T[Tailwind CSS]
        S[Shadcn UI]
        L[Lucide Icons]
    end

    subgraph Backend
        F[FastAPI]
        P[Python 3.11+]
        M[MongoDB]
    end

    subgraph AI
        G[GPT-5.2]
        E[Emergent LLM]
        RAG[RAG Pipeline]
    end

    R --> T
    T --> S
    S --> L
    F --> P
    P --> M
    G --> E
    E --> RAG
```

| Capa | Tecnología |
|------|-------------|
| **Frontend** | React 18, Tailwind CSS, Shadcn UI, Lucide Icons |
| **Backend** | FastAPI, Python 3.11+, Pydantic |
| **Base de Datos** | MongoDB (Motor async) |
| **IA** | GPT-5.2 via Emergent LLM |
| **Procesamiento** | PyPDF2 para PDFs |

---

## 📊 Estados del Proyecto

```mermaid
stateDiagram-v2
    [*] --> Activo : Crear proyecto
    Activo --> Analizando : Subir documento
    Analizando --> Completado : Análisis finish
    Analizando --> Error : Error en análisis
    Completado --> Activo : Nuevo documento
    Error --> Activo : Reintentar
```

| Estado | Descripción |
|--------|-------------|
| 🟢 **Activo** | Proyecto creado, esperando documentos |
| 🟡 **Analizando** | Documento en procesamiento con IA |
| ✅ **Completado** | Análisis terminado |
| 🔴 **Error** | Fallo en el procesamiento |

---

## 🔌 Endpoints API

```mermaid
flowchart LR
    subgraph Projects
        CP["POST /projects"]
        GP["GET /projects"]
        GSP["GET /projects/{id}"]
    end

    subgraph Documents
        UD["POST /upload"]
        GD["GET /documents"]
    end

    subgraph Analysis
        GA["GET /analysis"]
    end

    subgraph Chat
        SM["POST /chat"]
        GH["GET /history"]
    end
```

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/projects` | Crear proyecto |
| `GET` | `/api/projects` | Listar proyectos |
| `GET` | `/api/projects/{id}` | Obtener proyecto |
| `POST` | `/api/projects/{id}/upload` | Subir documento PDF |
| `GET` | `/api/projects/{id}/documents` | Listar documentos |
| `GET` | `/api/projects/{id}/analysis` | Ver análisis |
| `POST` | `/api/projects/{id}/chat` | Enviar mensaje |
| `GET` | `/api/projects/{id}/chat/history` | Historial |

---

## 🎨 Diseño y UX

### Paleta de Colores

| Propósito | Color | Uso |
|-----------|-------|-----|
| Primary | `#002FA7` | Botones, headers |
| Background | `#FAFAFA` | Fondo general |
| Surface | `#FFFFFF` | Cards, paneles |
| Error | `#DC2626` | Errores críticos |
| Warning | `#D97706` | Advertencias |
| Success | `#059669` | Cumplimiento |

### Tipografía

- **Títulos**: Chivo
- **Cuerpo**: IBM Plex Sans  
- **Técnico**: IBM Plex Mono

---

## 🚀 Instalación y Ejecución

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Variables de Entorno

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=gproa_bimia
EMERGENT_LLM_KEY=your_key_here
CORS_ORIGINS=*
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## 📈 Funcionalidades del Copiloto

```
Copiloto IA
├── Análisis Técnico
│   ├── Detección de errores
│   ├── Evaluación normativa
│   └── Recomendaciones
├── Chat Contextual
│   ├── Historial conversacional
│   ├── Contexto de documentos
│   └── RAG Pipeline
└── Cumplimiento
    ├── NOM-001-SEDE
    ├── Normas eléctricas
    └── Seguridad
```

---

## 🔒 Normativas Soportadas

- **NOM-001-SEDE** - Instalaciones eléctricas
- **NOM-019-SCFI** - Equipos eléctricos
- **NEC (National Electrical Code)**
- **IEEE Standards**

---

## 📝 Licencia

MIT License - GProA Technology

---

## 🤝 Contribuidores

Desarrollado por **GProA Technology** - Ingeniería Eléctrica Asistida por IA

---

*Documentación generada para GitHub - Compatible con MDX y Mermaid*