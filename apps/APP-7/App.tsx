
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChatPanel from './components/Chat';
import ResumePreview from './components/ResumePreview';
import SavedResumesPanel from './components/SavedResumesPanel';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/UserDashboard';
import EmailConfirmation from './components/EmailConfirmation';
import PaymentResult from './components/PaymentResult';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { processUserMessage, editUserPhoto } from './services/geminiService';
import { saveResumeToCloud } from './services/resumeService';
import { useTheme } from './hooks/useTheme';
import { useAuthStatus } from './hooks/useAuthStatus';
import type { ChatMessage } from './types';
import MoonIcon from './components/icons/MoonIcon';
import SunIcon from './components/icons/SunIcon';
import FolderIcon from './components/icons/FolderIcon';
import SaveIcon from './components/icons/SaveIcon';

// Use any to access CDN libraries on window
declare const window: any;

const initialResumeHtml = `
<div class="font-sans bg-white flex" style="min-height: 297mm; width: 210mm;">
    <aside class="w-1/3 bg-teal-800 text-gray-200 p-8 flex flex-col">
        <div class="text-center mb-10">
             <img id="resume-photo" alt="Foto do perfil" class="w-36 h-36 rounded-full object-cover mx-auto mb-4 border-4 border-teal-400 hidden">
             <h1 class="text-3xl font-bold text-white tracking-tight" contenteditable="true">Seu Nome</h1>
             <p class="text-lg text-teal-300 mt-1" contenteditable="true">Sua Profissão</p>
        </div>
        
        <div class="space-y-6 text-sm">
            <section>
                <h2 class="text-sm font-bold uppercase text-teal-400 tracking-widest mb-3">Contato</h2>
                <ul class="space-y-3" contenteditable="true">
                    <li>seu.email@example.com</li>
                    <li>(11) 99999-8888</li>
                    <li>linkedin.com/in/seu-perfil</li>
                    <li>Sua Cidade, Estado</li>
                </ul>
            </section>
            <section>
                <h2 class="text-sm font-bold uppercase text-teal-400 tracking-widest mb-3">Habilidades</h2>
                <div class="flex flex-wrap gap-2 text-sm" contenteditable="true">
                    <span class="bg-teal-700 text-gray-200 px-3 py-1 rounded-md">Liderança</span>
                </div>
            </section>
            <section id="languages-section" class="hidden">
                <h2 class="text-sm font-bold uppercase text-teal-400 tracking-widest mb-3">Idiomas</h2>
                <div class="space-y-1" contenteditable="true"><p>Português (Nativo)</p></div>
            </section>
        </div>
    </aside>
    <main class="w-2/3 p-10 bg-gray-100 text-gray-700">
        <section class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Resumo Profissional</h2>
            <p class="leading-relaxed" contenteditable="true">Vamos começar! Use o chat para me contar sobre sua carreira, ou escolha um novo design acima.</p>
        </section>
        <section id="objective-section" class="mb-8 hidden"><h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Objetivo</h2><p class="leading-relaxed" contenteditable="true"></p></section>
        <section class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Experiência Profissional</h2>
            <div class="mb-6" contenteditable="true">
                <h3 class="text-xl font-semibold text-teal-700">Seu Cargo</h3>
                <p>Nome da Empresa | Jan 2020 - Presente</p>
                <ul class="list-disc list-inside mt-2 space-y-2"><li>Suas conquistas...</li></ul>
            </div>
        </section>
        <section id="projects-section" class="mb-8 hidden"><h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Projetos</h2><div class="mb-6" contenteditable="true"><h3>Nome do Projeto</h3><p>Descrição...</p></div></section>
        <section>
            <h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Formação Acadêmica</h2>
            <div class="mb-4" contenteditable="true"><h3 class="text-xl font-semibold text-teal-700">Seu Diploma</h3><p>Nome da Instituição | 2016 - 2020</p></div>
        </section>
        <section id="certifications-section" class="mt-8 hidden"><h2 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">Certificações</h2><div class="mb-4" contenteditable="true"><h3>Nome da Certificação</h3><p>Instituição Emissora</p></div></section>
    </main>
</div>
`;


const initialChat: ChatMessage[] = [
    { sender: 'ai', text: 'Olá! Sou seu Estrategista de Carreira e coordeno uma equipe de especialistas em IA para criar seu currículo. Para começar, envie sua foto, conte-me sobre sua experiência, ou escolha um novo design. Vamos criar algo incrível juntos!' },
];

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
      resolve({ base64: data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};


const AppContent: React.FC = () => {
  const [resumeHtml, setResumeHtml] = useState<string>(initialResumeHtml);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(initialChat);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'editor' | 'payment-success' | 'payment-failure' | 'payment-pending'>('landing');
  
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userPhotoMimeType, setUserPhotoMimeType] = useState<string | null>(null);
  const [professionalPhoto, setProfessionalPhoto] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);
  const [showSavedResumes, setShowSavedResumes] = useState<boolean>(false);
  const [currentTemplate, setCurrentTemplate] = useState<string>('Modern');
  const [currentColor, setCurrentColor] = useState<string>('teal');
  
  const { theme, toggleTheme } = useTheme();
  const { user, profile, loading: authLoading, useCredits } = useAuth();
  const { isEmailConfirmed, loading: emailLoading } = useAuthStatus();

  useEffect(() => {
    // Check for payment result in URL
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment_status')
    
    if (paymentStatus) {
      if (paymentStatus === 'approved') {
        setCurrentView('payment-success')
      } else if (paymentStatus === 'pending') {
        setCurrentView('payment-pending')
      } else {
        setCurrentView('payment-failure')
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    if (!authLoading && !emailLoading) {
      if (user) {
        if (isEmailConfirmed === false) {
          // User exists but email not confirmed - show confirmation screen
          setCurrentView('landing'); // Will be handled by EmailConfirmation component
        } else {
          setCurrentView('dashboard');
        }
      } else {
        setCurrentView('landing');
      }
    }
  }, [user, authLoading, emailLoading, isEmailConfirmed]);


  const handleSendMessage = useCallback(async (message: string, isSystemMessage = false) => {
    // Check credits for non-system messages
    if (!isSystemMessage && profile) {
      const hasCredits = await useCredits(1);
      if (!hasCredits) {
        setChatHistory(prev => [...prev, { 
          sender: 'ai', 
          text: 'Você não tem créditos suficientes. Faça upgrade para continuar criando currículos!' 
        }]);
        return;
      }
    }

    const newHistoryEntry = isSystemMessage ? { sender: 'system' as const, text: message } : { sender: 'user' as const, text: message };
    const newChatHistory: ChatMessage[] = [...chatHistory, newHistoryEntry];
    setChatHistory(newChatHistory);
    setIsLoading(true);

    const result = await processUserMessage(newChatHistory, resumeHtml, !!userPhoto);

    if (result.action === 'resume') {
        setResumeHtml(result.data.resumeHtml);
        setChatHistory(prev => [...prev, { sender: 'ai', text: result.data.aiResponse }]);
    } else if (result.action === 'photo') {
        if (userPhoto && userPhotoMimeType) {
            setIsLoading(false);
            setIsPhotoLoading(true);
            const base64Data = userPhoto.split(',')[1];
            const editedPhotoBase64 = await editUserPhoto(base64Data, userPhotoMimeType, result.data.prompt);
            
            if (editedPhotoBase64) {
                setProfessionalPhoto(`data:image/png;base64,${editedPhotoBase64}`);
                setChatHistory(prev => [...prev, { sender: 'ai', text: 'Pronto! Sua foto foi aprimorada conforme solicitado. ✨' }]);
            } else {
                setChatHistory(prev => [...prev, { sender: 'ai', text: 'Desculpe, não consegui editar sua foto no momento. Isso pode acontecer devido a políticas de segurança da IA. Tente novamente com outra imagem ou uma solicitação diferente.' }]);
            }
            setIsPhotoLoading(false);
            return;
        } else {
            setChatHistory(prev => [...prev, { sender: 'ai', text: 'Para editar a foto, por favor, envie uma primeiro.' }]);
        }
    } else {
        setChatHistory(prev => [...prev, { sender: 'ai', text: result.data.aiResponse }]);
    }

    setIsLoading(false);
  }, [chatHistory, resumeHtml, userPhoto, userPhotoMimeType, profile, useCredits]);

  const handleDesignChange = useCallback(async (design: { template: string, color: string }) => {
    setCurrentTemplate(design.template);
    setCurrentColor(design.color);
    const message = `Por favor, aplique o template de design '${design.template}' com o esquema de cores '${design.color}'.`;
    await handleSendMessage(message, true);
  }, [handleSendMessage]);

  const handleSaveToCloud = useCallback(async (name: string) => {
    if (!user) return null;
    
    return await saveResumeToCloud(
      name,
      resumeHtml,
      currentTemplate,
      currentColor,
      user.id
    );
  }, [resumeHtml, currentTemplate, currentColor, user]);

  const handleSendPhoto = useCallback(async (file: File) => {
     setChatHistory(prev => [...prev, { sender: 'system', text: `Foto '${file.name}' enviada.` }]);
     const { base64, mimeType } = await fileToBase64(file);
     const dataUrl = `data:${mimeType};base64,${base64}`;
     setUserPhoto(dataUrl);
     setUserPhotoMimeType(mimeType);
     setProfessionalPhoto(null); // Reset professional photo if a new one is uploaded
     setChatHistory(prev => [...prev, { sender: 'ai', text: 'Ótima foto! Agora você pode me pedir para fazer edições, como "mude o fundo para um escritório" ou "me coloque com uma roupa social".' }]);
  }, []);

  const handleDeletePhoto = useCallback(() => {
    setUserPhoto(null);
    setUserPhotoMimeType(null);
    setProfessionalPhoto(null);
    setChatHistory(prev => [...prev, { sender: 'system', text: 'Foto removida.' }]);
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    const { jsPDF } = window.jspdf;
    const html2canvas = window.html2canvas;

    const canvasElement = document.getElementById('resume-canvas');

    if (!canvasElement || !jsPDF || !html2canvas) {
      console.error("PDF generation dependencies or resume element not available.");
      return;
    }
    
    // Use a clone of the live element to avoid rendering issues
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);
    
    const liveContentClone = canvasElement.cloneNode(true) as HTMLElement;
    container.appendChild(liveContentClone);

    // Ensure the offscreen photo has the correct src
    const livePhoto = document.getElementById('resume-photo') as HTMLImageElement;
    const offscreenPhoto = container.querySelector('#resume-photo') as HTMLImageElement;
    if (livePhoto && offscreenPhoto && livePhoto.src && !livePhoto.classList.contains('hidden')) {
      offscreenPhoto.src = livePhoto.src;
      offscreenPhoto.classList.remove('hidden');
    }

    const canvas = await html2canvas(container, {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps= pdf.getImageProperties(imgData);
    // Scale image height to fit the PDF width
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add the image, scaling it to fit onto a single A4 page.
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

    pdf.save('curriculo-ia.pdf');
    document.body.removeChild(container);
    
  }, []);


  if (authLoading || emailLoading) {
    return (
      <div className="h-screen w-screen bg-slate-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show email confirmation if user exists but email not confirmed
  if (user && isEmailConfirmed === false) {
    return <EmailConfirmation />;
  }

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentView('editor')} />;
  }

  if (currentView === 'dashboard') {
    return (
      <UserDashboard
        onLoadResume={(html) => {
          setResumeHtml(html);
          setCurrentView('editor');
        }}
        onCreateNew={() => {
          setResumeHtml(initialResumeHtml);
          setChatHistory(initialChat);
          setCurrentView('editor');
        }}
      />
    );
  }

  // Payment result pages
  if (currentView === 'payment-success') {
    return <PaymentResult status="success" onContinue={() => setCurrentView('dashboard')} />
  }

  if (currentView === 'payment-failure') {
    return <PaymentResult status="failure" onContinue={() => setCurrentView('dashboard')} />
  }

  if (currentView === 'payment-pending') {
    return <PaymentResult status="pending" onContinue={() => setCurrentView('dashboard')} />
  }

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-gray-900 flex p-4 md:p-8 gap-4 md:gap-8 font-sans transition-colors">
      {/* Header com controles */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        {user && (
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Dashboard"
          >
            <FolderIcon className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setShowSavedResumes(true)}
          className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Salvar Currículo"
        >
          <SaveIcon className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full md:w-1/3 lg:w-2/5 xl:w-1/3 h-full">
        <ChatPanel 
            chatHistory={chatHistory} 
            onSendMessage={handleSendMessage} 
            onSendPhoto={handleSendPhoto}
            isLoading={isLoading || isPhotoLoading} 
        />
      </div>
      <div className="flex-1 h-full hidden md:block">
        <ResumePreview 
            resumeHtml={resumeHtml}
            onHtmlChange={setResumeHtml}
            userPhoto={userPhoto}
            professionalPhoto={professionalPhoto}
            isPhotoLoading={isPhotoLoading}
            onDownloadPdf={handleDownloadPdf}
            isLoading={isLoading}
            onDesignChange={handleDesignChange}
            onDeletePhoto={handleDeletePhoto}
        />
      </div>

      <SavedResumesPanel
        currentResumeHtml={resumeHtml}
        onLoadResume={setResumeHtml}
        isVisible={showSavedResumes}
        onClose={() => setShowSavedResumes(false)}
        onSaveToCloud={user ? handleSaveToCloud : undefined}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;