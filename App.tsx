import React, { useState, useCallback, useEffect } from 'react';
import { generateChatResponse, generateSuggestions } from './services/geminiService';
import type { Message, LegalDocument } from './types';
import { Role } from './types';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import AdminLoginModal from './components/AdminLoginModal';
import LockIcon from './components/icons/LockIcon';
import LogoutIcon from './components/icons/LogoutIcon';

// Documentos legales precargados (usados como valor inicial si no hay nada en localStorage)
const PRELOADED_DOCUMENTS: LegalDocument[] = [
  {
    id: 'sentencia_1',
    title: 'Sentencia de Amparo 123/2023',
    summary: 'Resolución sobre un caso de amparo indirecto y debido proceso.',
    content: `SENTENCIA DE AMPARO 123/2023. VISTO para resolver el juicio de amparo indirecto promovido por Juan Pérez en contra de actos del Juez Quinto de lo Civil. RESULTANDO: 1. El quejoso señala como acto reclamado la orden de desalojo dictada en el expediente 456/2022 sin haber sido oído y vencido en juicio. 2. La autoridad responsable rindió su informe justificando su actuar en la supuesta rebeldía del demandado. CONSIDERANDO: PRIMERO. Este juzgado es competente para conocer del presente juicio. SEGUNDO. Del análisis de las constancias, se advierte que el quejoso no fue debidamente emplazado al juicio de origen, violando en su perjuicio la garantía de audiencia prevista en el artículo 14 Constitucional. TERCERO. Al no haber sido emplazado, no tuvo oportunidad de ofrecer pruebas ni de formular alegatos, lo que constituye una violación procesal grave que amerita la reposición del procedimiento. RESUELVE: ÚNICO. La Justicia de la Unión AMPARA Y PROTEGE a Juan Pérez en contra del acto reclamado, para el efecto de que la autoridad responsable deje insubsistente todo lo actuado a partir del auto de admisión y ordene reponer el procedimiento para que se emplace debidamente al quejoso.`
  },
  {
    id: 'contrato_2',
    title: 'Contrato de Arrendamiento 789',
    summary: 'Contrato de alquiler de inmueble para uso habitacional.',
    content: `CONTRATO DE ARRENDAMIENTO que celebran, por una parte, como ARRENDADOR, la Sra. Ana García, y por la otra, como ARRENDATARIO, el Sr. Carlos López, respecto del inmueble ubicado en Calle Falsa 123. CLÁUSULAS: PRIMERA. El objeto del contrato es el arrendamiento del inmueble mencionado para uso exclusivo de casa habitación. SEGUNDA. La renta mensual será de $10,000.00 (diez mil pesos 00/100 M.N.), pagaderos los primeros cinco días de cada mes. TERCERA. El ARRENDATARIO entrega en este acto la cantidad de $10,000.00 como depósito en garantía, el cual será devuelto al finalizar el contrato, siempre y cuando no existan adeudos ni daños al inmueble. CUARTA. Son causas de rescisión del contrato la falta de pago de dos o más rentas consecutivas, el subarrendar el inmueble o darle un uso distinto al convenido. QUINTA. Las reparaciones mayores correrán a cargo del ARRENDADOR, mientras que el mantenimiento menor derivado del uso será responsabilidad del ARRENDATARIO.`
  },
  {
    id: 'laudo_3',
    title: 'Laudo Laboral 45/2024',
    summary: 'Resolución de un conflicto laboral por despido injustificado.',
    content: `LAUDO. Expediente 45/2024. Actor: María Rodríguez. Demandado: Empresa XYZ, S.A. de C.V. Se resuelve la controversia sobre el despido del que fue objeto la actora. RESULTANDOS: 1. La parte actora reclamó el pago de indemnización constitucional, salarios caídos, vacaciones y aguinaldo, argumentando un despido injustificado. 2. La parte demandada negó el despido, aduciendo que la trabajadora abandonó sus labores. CONSIDERANDOS: PRIMERO. La carga de la prueba sobre la causa de terminación de la relación laboral recae en el patrón. SEGUNDO. La demandada no ofreció pruebas suficientes para acreditar el supuesto abandono de empleo. En cambio, la actora presentó testigos que corroboran la existencia del despido. TERCERO. Al no justificar la causa del despido, este se considera injustificado. RESOLUTIVOS: PRIMERO. Se condena a la empresa XYZ, S.A. de C.V. a pagar a María Rodríguez la indemnización constitucional equivalente a tres meses de salario. SEGUNDO. Se condena al pago de salarios caídos desde la fecha del despido hasta la fecha de cumplimiento de este laudo. TERCERO. Se absuelve del pago de vacaciones por haberse acreditado su goce.`
  }
];

const DOCUMENT_STORAGE_KEY = 'legal_documents_repository';
const ADMIN_PASSWORD = '252525';

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [areSuggestionsLoading, setAreSuggestionsLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load documents from localStorage on initial render
  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem(DOCUMENT_STORAGE_KEY);
      const initialDocs = savedDocs ? JSON.parse(savedDocs) : PRELOADED_DOCUMENTS;
      if (initialDocs.length === 0) {
        localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(PRELOADED_DOCUMENTS));
        setDocuments(PRELOADED_DOCUMENTS);
      } else {
        setDocuments(initialDocs);
      }
    } catch (e) {
      console.error("Failed to load documents from storage:", e);
      setDocuments(PRELOADED_DOCUMENTS);
    }
  }, []);

  // Set initial message when documents state is finalized
  useEffect(() => {
    if (documents.length > 0) {
      setMessages([
        {
          role: Role.Model,
          content: "Hola. Soy el Asistente de Jurisprudencia. Mi conocimiento se basa en minutas de fallos de la Corte Suprema. ¿En qué puedo ayudarte?",
        },
      ]);
    } else {
      setMessages([{ role: Role.Model, content: "No hay documentos cargados. Por favor, pida a un administrador que agregue jurisprudencia." }]);
    }
  }, [documents]);

  // Generate topic suggestions when documents change
  useEffect(() => {
      if (documents.length > 0) {
          setAreSuggestionsLoading(true);
          generateSuggestions(documents)
              .then(suggestions => {
                  setTopicSuggestions(suggestions);
              })
              .catch(err => {
                  console.error("Error generating suggestions:", err);
                  setTopicSuggestions([]); // Clear suggestions on error
              })
              .finally(() => {
                  setAreSuggestionsLoading(false);
              });
      } else {
          setTopicSuggestions([]);
      }
  }, [documents]);


  const handleSendMessage = useCallback(async (userInput: string) => {
    if (isSendingMessage || documents.length === 0) return;

    setIsSendingMessage(true);
    setError(null);
    const userMessage: Message = { role: Role.User, content: userInput };
    // We create a new messages array for the state and for the API call
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await generateChatResponse(documents, newMessages);
      const modelMessage: Message = { role: Role.Model, content: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (e: any) {
      console.error("Error sending message:", e);
      const details = e.details ? ` Details: ${e.details}.` : '';
      const errorMessage = e.message ? e.message : "Ocurrió un error desconocido.";
      setError(`Error al comunicarse con la IA: ${errorMessage}${details}`);
      setMessages(prev => [...prev, { role: Role.Model, content: "Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo." }]);
    } finally {
      setIsSendingMessage(false);
    }
  }, [isSendingMessage, messages, documents]);

  const handleAddMultipleDocuments = useCallback((newDocsData: Omit<LegalDocument, 'id'>[]) => {
    const newDocs: LegalDocument[] = newDocsData.map((docData, index) => ({
      ...docData,
      id: `doc_${Date.now()}_${index}`
    }));

    setDocuments(prevDocs => {
      const updatedDocs = [...prevDocs, ...newDocs];
      localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(updatedDocs));
      return updatedDocs;
    });
  }, []);
  
  const handleDeleteDocument = useCallback((docId: string) => {
    setDocuments(prevDocs => {
      const updatedDocs = prevDocs.filter(doc => doc.id !== docId);
      localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(updatedDocs));
      return updatedDocs;
    });
  }, []);
  
  const handleLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setIsLoginModalOpen(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
  };


  return (
    <div className="flex flex-col h-screen font-sans text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-900">
      <header 
        className="relative flex items-center justify-center bg-primary-600 text-white shadow-md z-20"
        style={{ 
          paddingTop: 'calc(1rem + env(safe-area-inset-top))', 
          paddingBottom: '1rem', 
          paddingLeft: '1rem', 
          paddingRight: '1rem' 
        }}
      >
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold">
            Asistente Jurisprudencia
          </h1>
          <p className="text-xs md:text-sm text-primary-200 mt-1">
            Basado en minutas de jurisprudencia
          </p>
        </div>
        <button
          onClick={() => (isAdminLoggedIn ? handleLogout() : setIsLoginModalOpen(true))}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 rounded-full text-primary-100 hover:bg-white/20 transition-colors"
          aria-label={isAdminLoggedIn ? 'Cerrar sesión de administrador' : 'Abrir inicio de sesión de administrador'}
        >
          {isAdminLoggedIn ? <LogoutIcon /> : <LockIcon />}
        </button>
      </header>
      
      <main className="flex-1 overflow-hidden transition-all duration-300">
        {isAdminLoggedIn ? (
          <AdminPanel
            documents={documents}
            onAddMultipleDocuments={handleAddMultipleDocuments}
            onDeleteDocument={handleDeleteDocument}
          />
        ) : (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isSendingMessage}
            isReady={documents.length > 0}
            error={error}
            topicSuggestions={topicSuggestions}
            areSuggestionsLoading={areSuggestionsLoading}
          />
        )}
      </main>
      
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

export default App;