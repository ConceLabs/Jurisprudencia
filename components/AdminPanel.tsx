import React, { useState, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import type { LegalDocument } from '../types';
import TrashIcon from './icons/TrashIcon';
import UploadCloudIcon from './icons/UploadCloudIcon';
import Loader from './Loader';

interface AdminPanelProps {
  documents: LegalDocument[];
  onAddMultipleDocuments: (docs: Omit<LegalDocument, 'id'>[]) => void;
  onDeleteDocument: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ documents, onAddMultipleDocuments, onDeleteDocument }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadFeedback({ success: 0, errors: [] });

    const newDocs: Omit<LegalDocument, 'id'>[] = [];
    const errors: string[] = [];

    await Promise.all(
      Array.from(files).map(async (file) => {
        try {
          let content = '';
          if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            content = await file.text();
          } else if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
          } else {
            throw new Error(`Formato no soportado.`);
          }

          if (!content.trim()) {
            throw new Error(`Archivo vacío o ilegible.`);
          }

          const title = file.name.replace(/\.[^/.]+$/, "");
          const summary = content.substring(0, 120).replace(/\s+/g, ' ').trim() + '...';

          newDocs.push({ title, summary, content });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido.';
          errors.push(`Error en '${file.name}': ${message}`);
        }
      })
    );

    if (newDocs.length > 0) {
      onAddMultipleDocuments(newDocs);
    }

    setUploadFeedback({ success: newDocs.length, errors });
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onAddMultipleDocuments]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isUploading) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && !isUploading) {
      handleFiles(e.target.files);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Carga Masiva de Documentos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Arrastra y suelta archivos (.txt, .md, .docx) para añadirlos al repositorio.</p>
        </header>

        <div
          onClick={triggerFileSelect}
          onDragEnter={(e) => handleDragEvents(e, true)}
          onDragLeave={(e) => handleDragEvents(e, false)}
          onDragOver={(e) => handleDragEvents(e, true)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center w-full p-8 md:p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors mb-6 ${
            isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
          } ${isUploading ? 'cursor-wait bg-slate-100 dark:bg-slate-800' : ''}`}
        >
          <input ref={fileInputRef} type="file" onChange={handleFileChange} accept=".txt,.md,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" disabled={isUploading} multiple />
          {isUploading ? (
              <div className="text-center">
                <Loader />
                <p className="mt-4 text-slate-600 dark:text-slate-400">Procesando archivos...</p>
              </div>
          ) : (
            <>
              <UploadCloudIcon />
              <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-primary-600 dark:text-primary-400">Haz clic para subir</span> o arrastra y suelta
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Soporta múltiples archivos .txt, .md, .docx</p>
            </>
          )}
        </div>
        
        {uploadFeedback.success > 0 || uploadFeedback.errors.length > 0 ? (
          <div className="mb-6 p-4 rounded-lg border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              {uploadFeedback.success > 0 && <p className="text-sm text-green-600 dark:text-green-400 mb-2">✓ {uploadFeedback.success} documento(s) agregado(s) con éxito.</p>}
              {uploadFeedback.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-500">✗ {error}</p>
              ))}
          </div>
        ) : null}

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Documentos Actuales ({documents.length})</h3>
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{doc.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{doc.summary}</p>
              </div>
              <button
                onClick={() => onDeleteDocument(doc.id)}
                className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
                aria-label={`Eliminar ${doc.title}`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
           {documents.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-8">No hay documentos en el repositorio.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;