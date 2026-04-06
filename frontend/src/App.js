import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Upload, Send, FileText, AlertCircle, CheckCircle, AlertTriangle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState("industrial");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast.error("Ingresa un nombre para el proyecto");
      return;
    }

    try {
      const response = await axios.post(`${API}/projects`, {
        name: newProjectName,
        type: newProjectType
      });
      toast.success("Proyecto creado exitosamente");
      navigate(`/project/${response.data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Error al crear proyecto");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#002FA7]" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] text-[#0F172A]">
      {/* Header */}
      <div className="border-b border-[#E4E4E7] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-4xl tracking-tight font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Copiloto de Ingeniería Eléctrica
          </h1>
          <p className="text-sm tracking-wide text-[#475569] mt-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
            Análisis inteligente de proyectos eléctricos con IA
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Create Project Section */}
        {!showCreateDialog && projects.length === 0 && (
          <div className="bg-white border border-[#E4E4E7] rounded-sm p-8 text-center">
            <h2 className="text-2xl tracking-tight font-semibold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Comienza tu primer proyecto
            </h2>
            <p className="text-base leading-relaxed text-[#475569] mb-6" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Crea un proyecto, sube tus documentos eléctricos y obtén análisis automático con detección de errores.
            </p>
            <Button
              data-testid="create-first-project-btn"
              onClick={() => setShowCreateDialog(true)}
              className="bg-[#002FA7] hover:bg-[#002072] text-white rounded-sm px-6"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Proyecto
            </Button>
          </div>
        )}

        {/* Create Form */}
        {showCreateDialog && (
          <div className="bg-white border border-[#E4E4E7] rounded-sm p-8 mb-6">
            <h2 className="text-2xl tracking-tight font-semibold mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Nuevo Proyecto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm tracking-wide text-[#475569] block mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  Nombre del Proyecto
                </label>
                <Input
                  data-testid="project-name-input"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="ej: Instalación Eléctrica Planta Norte"
                  className="rounded-sm"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                />
              </div>
              <div>
                <label className="text-sm tracking-wide text-[#475569] block mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  Tipo de Proyecto
                </label>
                <select
                  data-testid="project-type-select"
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E4E4E7] rounded-sm bg-white"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                >
                  <option value="industrial">Industrial</option>
                  <option value="comercial">Comercial</option>
                  <option value="residencial">Residencial</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  data-testid="confirm-create-project-btn"
                  onClick={createProject}
                  className="bg-[#002FA7] hover:bg-[#002072] text-white rounded-sm"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                >
                  Crear
                </Button>
                <Button
                  data-testid="cancel-create-project-btn"
                  onClick={() => setShowCreateDialog(false)}
                  variant="outline"
                  className="rounded-sm border-[#E4E4E7]"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        {projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl tracking-tight font-semibold" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Mis Proyectos
              </h2>
              <Button
                data-testid="new-project-btn"
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#002FA7] hover:bg-[#002072] text-white rounded-sm"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  data-testid={`project-card-${project.id}`}
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="bg-white border border-[#E4E4E7] rounded-sm p-6 cursor-pointer hover:bg-[#F8F9FA] transition-colors duration-150"
                >
                  <h3 className="text-xl font-medium mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#475569]">
                      {project.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-sm ${
                        project.status === 'completed'
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : project.status === 'analyzing'
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : 'bg-[#F0F9FF] text-[#0284C7]'
                      }`}
                      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                    >
                      {project.status === 'completed' ? 'Analizado' : project.status === 'analyzing' ? 'Procesando' : 'Activo'}
                    </span>
                  </div>
                  <p className="text-sm text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    Creado: {new Date(project.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectView = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadProjectData();
    const interval = setInterval(loadProjectData, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [projectRes, docsRes, analysisRes, chatRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}`),
        axios.get(`${API}/projects/${projectId}/documents`),
        axios.get(`${API}/projects/${projectId}/analysis`),
        axios.get(`${API}/projects/${projectId}/chat/history`)
      ]);

      setProject(projectRes.data);
      setDocuments(docsRes.data);
      setAnalysis(analysisRes.data);
      setChatMessages(chatRes.data);
    } catch (error) {
      console.error("Error loading project data:", error);
      toast.error("Error al cargar datos del proyecto");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API}/projects/${projectId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Documento subido exitosamente. Analizando...");
      setTimeout(loadProjectData, 2000);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error al subir documento");
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || sending) return;

    const userMessage = chatInput;
    setChatInput("");
    setSending(true);

    // Add user message immediately
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await axios.post(`${API}/projects/${projectId}/chat`, {
        content: userMessage
      });

      setChatMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#002FA7]" />
      </div>
    );
  }

  const hasDocuments = documents.length > 0;
  const isAnalyzing = project?.status === 'analyzing';

  return (
    <div className="w-full h-screen overflow-hidden bg-[#FAFAFA] text-[#0F172A] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#E4E4E7] bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl tracking-tight font-semibold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              {project?.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#475569]">
                {project?.type}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-sm ${
                  project?.status === 'completed'
                    ? 'bg-[#ECFDF5] text-[#059669]'
                    : project?.status === 'analyzing'
                    ? 'bg-[#FFFBEB] text-[#D97706]'
                    : 'bg-[#F0F9FF] text-[#0284C7]'
                }`}
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {project?.status === 'completed' ? 'Analizado' : project?.status === 'analyzing' ? 'Procesando' : 'Activo'}
              </span>
            </div>
          </div>
          <Button
            data-testid="back-to-dashboard-btn"
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="rounded-sm border-[#E4E4E7]"
            style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
          >
            ← Volver
          </Button>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 h-full w-full">
        {/* Left: Project Workspace */}
        <div className="col-span-1 md:col-span-8 h-full flex flex-col border-r border-[#E4E4E7] overflow-y-auto bg-white">
          <div className="p-8 space-y-6">
            {/* Upload Zone */}
            {!hasDocuments && (
              <div
                data-testid="upload-zone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-sm p-12 text-center cursor-pointer transition-colors duration-150 ${
                  dragActive
                    ? 'border-[#002FA7] bg-[#F0F9FF]'
                    : 'border-[#E4E4E7] hover:border-[#002FA7]'
                }`}
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1742415106160-594d07f6cc23?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwYmx1ZXByaW50JTIwcGF0dGVybnxlbnwwfHx8fDE3NzU1MDI3OTV8MA&ixlib=rb-4.1.0&q=85)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundBlendMode: 'overlay',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-[#002FA7]" strokeWidth={1.5} />
                <h3 className="text-xl font-medium mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Arrastra documentos aquí
                </h3>
                <p className="text-base leading-relaxed text-[#475569] mb-4" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                  o haz clic para seleccionar archivos PDF
                </p>
                <input
                  data-testid="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    data-testid="select-file-btn"
                    as="span"
                    className="bg-[#002FA7] hover:bg-[#002072] text-white rounded-sm"
                    style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      'Seleccionar Archivos'
                    )}
                  </Button>
                </label>
              </div>
            )}

            {/* Documents List */}
            {hasDocuments && (
              <div>
                <h3 className="text-xl font-medium mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Documentos del Proyecto
                </h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      data-testid={`document-item-${doc.id}`}
                      className="border border-[#E4E4E7] rounded-sm p-4 flex items-center gap-3"
                    >
                      <FileText className="w-5 h-5 text-[#002FA7]" strokeWidth={1.5} />
                      <div className="flex-1">
                        <p className="text-base font-medium" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          {doc.filename}
                        </p>
                        <p className="text-sm text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                          {doc.page_count} páginas
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#059669]" />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    data-testid="add-more-files-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="add-more-files"
                  />
                  <label htmlFor="add-more-files">
                    <Button
                      data-testid="add-more-files-btn"
                      as="span"
                      variant="outline"
                      className="rounded-sm border-[#E4E4E7]"
                      style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar más documentos
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {hasDocuments && analysis && (
              <div>
                <Separator className="my-6" />
                <h3 className="text-xl font-medium mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Análisis Automático
                </h3>

                {isAnalyzing && (
                  <div className="border border-[#E4E4E7] rounded-sm p-4 flex items-center gap-3 bg-[#FFFBEB]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" />
                    <p className="text-base" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                      Analizando documentos...
                    </p>
                  </div>
                )}

                {!isAnalyzing && analysis.summary && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="border border-[#E4E4E7] rounded-sm p-4">
                      <h4 className="text-base font-semibold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
                        Resumen Técnico
                      </h4>
                      <p className="text-base leading-relaxed" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                        {analysis.summary}
                      </p>
                    </div>

                    {/* Errors */}
                    {analysis.errors && analysis.errors.length > 0 && (
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#DC2626]" style={{ fontFamily: 'Chivo, sans-serif' }}>
                          Errores Detectados ({analysis.errors.length})
                        </h4>
                        <div className="space-y-2">
                          {analysis.errors.map((error, idx) => (
                            <div
                              key={idx}
                              data-testid={`error-card-${idx}`}
                              className="border-l-4 border-[#DC2626] bg-[#FEF2F2] p-4 rounded-sm"
                            >
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-base font-semibold text-[#DC2626] mb-1" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                    {error.type}
                                  </p>
                                  <p className="text-sm mb-2" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                    {error.description}
                                  </p>
                                  {error.norm && (
                                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#DC2626] mb-2">
                                      Norma: {error.norm}
                                    </p>
                                  )}
                                  {error.recommendation && (
                                    <p className="text-sm text-[#475569]" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                      <strong>Recomendación:</strong> {error.recommendation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {analysis.warnings && analysis.warnings.length > 0 && (
                      <div>
                        <h4 className="text-base font-semibold mb-2 text-[#D97706]" style={{ fontFamily: 'Chivo, sans-serif' }}>
                          Advertencias ({analysis.warnings.length})
                        </h4>
                        <div className="space-y-2">
                          {analysis.warnings.map((warning, idx) => (
                            <div
                              key={idx}
                              data-testid={`warning-card-${idx}`}
                              className="border-l-4 border-[#D97706] bg-[#FFFBEB] p-4 rounded-sm"
                            >
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm mb-1" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                    {warning.description}
                                  </p>
                                  {warning.recommendation && (
                                    <p className="text-sm text-[#475569]" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                      <strong>Recomendación:</strong> {warning.recommendation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance */}
                    {analysis.compliance && analysis.compliance.length > 0 && (
                      <div>
                        <h4 className="text-base font-semibold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
                          Cumplimiento Normativo
                        </h4>
                        <div className="space-y-2">
                          {analysis.compliance.map((comp, idx) => (
                            <div
                              key={idx}
                              data-testid={`compliance-card-${idx}`}
                              className="border border-[#E4E4E7] rounded-sm p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#002FA7]">
                                  {comp.norm}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-sm ${
                                    comp.status === 'cumple'
                                      ? 'bg-[#ECFDF5] text-[#059669]'
                                      : comp.status === 'no cumple'
                                      ? 'bg-[#FEF2F2] text-[#DC2626]'
                                      : 'bg-[#F8F9FA] text-[#475569]'
                                  }`}
                                  style={{ fontFamily: 'IBM Plex Mono, monospace' }}
                                >
                                  {comp.status}
                                </span>
                              </div>
                              <p className="text-sm" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                                {comp.details}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No issues found */}
                    {(!analysis.errors || analysis.errors.length === 0) &&
                     (!analysis.warnings || analysis.warnings.length === 0) && (
                      <div className="border border-[#E4E4E7] rounded-sm p-4 flex items-center gap-3 bg-[#ECFDF5]">
                        <CheckCircle className="w-5 h-5 text-[#059669]" />
                        <p className="text-base" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                          No se detectaron errores críticos en el análisis inicial.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Copilot Chat */}
        <div className="col-span-1 md:col-span-4 h-full flex flex-col bg-[#F8F9FA] shadow-inner">
          <div className="border-b border-[#E4E4E7] px-6 py-4 bg-white">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Copiloto IA
            </h2>
            <p className="text-sm text-[#475569] mt-1" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
              Ingeniero eléctrico senior
            </p>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div data-testid="chat-messages-container" className="space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[#94A3B8]" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
                    {hasDocuments
                      ? 'Pregunta sobre tu proyecto eléctrico...'
                      : 'Sube documentos para comenzar el análisis'}
                  </p>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  data-testid={`chat-message-${idx}`}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-sm p-3 ${
                      msg.role === 'user'
                        ? 'bg-[#0F172A] text-white'
                        : 'bg-white border border-[#E4E4E7] text-[#0F172A]'
                    }`}
                    style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E4E4E7] rounded-sm p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-[#002FA7]" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-[#E4E4E7] p-4 bg-white">
            <div className="flex gap-2">
              <Input
                data-testid="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={hasDocuments ? "Pregunta sobre el proyecto..." : "Sube documentos primero"}
                disabled={!hasDocuments || sending}
                className="rounded-sm flex-1"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
              />
              <Button
                data-testid="send-message-btn"
                onClick={sendMessage}
                disabled={!hasDocuments || !chatInput.trim() || sending}
                className="bg-[#002FA7] hover:bg-[#002072] text-white rounded-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;