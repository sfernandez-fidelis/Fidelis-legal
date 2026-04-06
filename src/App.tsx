import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { TemplateProvider } from './contexts/TemplateContext';
import { ContactProvider } from './contexts/ContactContext';
import AppContent from './AppContent';
import { Toaster } from './components/ui/sonner';

function LoginScreen() {
  const { login, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-serif italic text-gray-900 tracking-tight">Fidelis Legal</h1>
          <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Generador de Documentos Legales</p>
        </div>
        <div className="bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
          <p className="text-gray-600 mb-8 leading-relaxed">Inicie sesión con su cuenta institucional para acceder a la plataforma de generación de contratos.</p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-4 rounded-2xl hover:bg-black transition-all transform hover:-translate-y-1 shadow-lg font-medium"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { user } = useAuth();
  
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <DocumentProvider>
      <TemplateProvider>
        <ContactProvider>
          <AppContent />
        </ContactProvider>
      </TemplateProvider>
    </DocumentProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toaster />
    </AuthProvider>
  );
}
