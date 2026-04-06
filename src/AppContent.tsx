import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useDocuments } from './contexts/DocumentContext';
import { ContractType, CounterGuaranteeData } from './types';
import CounterGuaranteeForm from './components/CounterGuaranteeForm';
import HistoryList from './components/HistoryList';
import TemplateEditor from './components/TemplateEditor';
import { useTemplates } from './contexts/TemplateContext';
import { generateContractPDF } from './utils/pdf/pdfGenerator';
import { generateWordDocument } from './utils/word/wordGenerator';
import { FileText, LogOut, History, LayoutDashboard, Settings, ChevronRight, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AppContent() {
  const { user, logout } = useAuth();
  const { contracts, saveContract, deleteContract } = useDocuments();
  const { getTemplate } = useTemplates();
  const [view, setView] = useState<'dashboard' | 'form' | 'history' | 'templates'>('dashboard');
  const [selectedType, setSelectedType] = useState<ContractType>(ContractType.COUNTER_GUARANTEE_PRIVATE);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredContracts = contracts.filter(c => 
    c.principal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.policies.some(p => p.number.includes(searchTerm))
  );

  const handleSave = async (data: CounterGuaranteeData) => {
    try {
      const id = await saveContract(data);
      toast.success('Contrato guardado exitosamente');
      return id;
    } catch (error) {
      toast.error('Error al guardar el contrato');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteContract(confirmDeleteId);
      toast.success('Documento eliminado');
    } catch (error) {
      toast.error('Error al eliminar el contrato');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleGeneratePDF = async (data: CounterGuaranteeData) => {
    try {
      let currentData = { ...data };
      if (!currentData.id) {
        const id = await saveContract(currentData);
        currentData.id = id;
        toast.success('Contrato guardado exitosamente');
      }
      
      const template = getTemplate(currentData.type);
      await generateContractPDF(currentData, template?.content);
      
      toast.success('PDF generado exitosamente');
      return currentData.id;
    } catch (error) {
      toast.error('Error al generar el PDF');
    }
  };

  const handleGenerateWord = async (data: CounterGuaranteeData) => {
    try {
      let currentData = { ...data };
      if (!currentData.id) {
        const id = await saveContract(currentData);
        currentData.id = id;
        toast.success('Contrato guardado exitosamente');
      }
      
      const template = getTemplate(currentData.type);
      await generateWordDocument(currentData, template?.content);
      
      toast.success('Documento Word generado exitosamente');
      return currentData.id;
    } catch (error) {
      toast.error('Error al generar el documento Word');
    }
  };

  if (!user) {
    return null; // Handled by MainApp wrapper
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <h1 className="text-2xl font-serif italic text-gray-900">Fidelis Legal</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button
            onClick={() => setView('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'history' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <History size={20} /> Historial
          </button>
          <button
            onClick={() => setView('templates')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'templates' ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText size={20} /> Plantillas
          </button>
        </nav>

        <div className="p-6 border-t border-gray-50">
          <div className="flex items-center gap-3 mb-6 px-2">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-brand-100" alt="Avatar" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        {view === 'dashboard' && (
          <div className="max-w-5xl mx-auto space-y-12">
            <header className="flex justify-between items-end">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif italic text-gray-900">Bienvenido, {user.displayName?.split(' ')[0]}</h2>
                <p className="text-gray-500">¿Qué documento legal desea generar hoy?</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(new Date(), 'EEEE, d MMMM')}</p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                onClick={() => { setSelectedType(ContractType.COUNTER_GUARANTEE_PRIVATE); setView('form'); }}
                className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Contragarantía</h3>
                    <p className="text-sm text-gray-500">Documento Privado</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Formato estándar para contragarantías con legalización de firmas.</p>
                  <div className="pt-4 flex items-center text-brand-600 font-bold text-xs uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    Generar ahora <ChevronRight size={16} />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { setSelectedType(ContractType.COUNTER_GUARANTEE_PUBLIC); setView('form'); }}
                className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Contragarantía</h3>
                    <p className="text-sm text-gray-500">Escritura Pública</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Protocolo para contragarantías elevadas a escritura pública.</p>
                  <div className="pt-4 flex items-center text-brand-600 font-bold text-xs uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    Generar ahora <ChevronRight size={16} />
                  </div>
                </div>
              </div>

              <div 
                onClick={() => { setSelectedType(ContractType.MORTGAGE_GUARANTEE); setView('form'); }}
                className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Garantía Hipotecaria</h3>
                    <p className="text-sm text-gray-500">Escritura Pública</p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">Protocolo para constitución de hipotecas como garantía.</p>
                  <div className="pt-4 flex items-center text-brand-600 font-bold text-xs uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    Generar ahora <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Documentos Recientes</h3>
                <button onClick={() => setView('history')} className="text-xs font-bold text-brand-600 uppercase tracking-widest hover:underline">Ver todo</button>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documento</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fiado</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contracts.slice(0, 5).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {c.principal.entityName || c.principal.name} -{c.type === ContractType.COUNTER_GUARANTEE_PRIVATE ? 'Documento Privado' : 'Escritura Pública'}- {c.policies.map(p => p.number).join(' y ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{c.principal.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{format(new Date(c.createdAt), 'dd/MM/yyyy')}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleGeneratePDF(c)}
                              className="text-brand-600 hover:text-brand-700 font-bold text-[10px] uppercase tracking-widest"
                            >
                              PDF
                            </button>
                            <span className="text-gray-200">|</span>
                            <button 
                              onClick={() => handleGenerateWord(c)}
                              className="text-brand-600 hover:text-brand-700 font-bold text-[10px] uppercase tracking-widest"
                            >
                              Word
                            </button>
                            <span className="text-gray-200">|</span>
                            <button 
                              onClick={() => c.id && handleDelete(c.id)}
                              className="text-red-500 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {contracts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">No hay documentos generados aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {view === 'form' && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setView('dashboard')}
              className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
            >
              <ChevronRight size={20} className="rotate-180" /> Volver al Dashboard
            </button>
            <CounterGuaranteeForm 
              key={selectedType}
              initialType={selectedType}
              onSave={handleSave} 
              onGeneratePDF={handleGeneratePDF} 
              onGenerateWord={handleGenerateWord}
            />
          </div>
        )}

        {view === 'history' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif italic text-gray-900">Historial de Documentos</h2>
                <p className="text-gray-500">Consulte y descargue documentos generados anteriormente.</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por fiado o póliza..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>
              </div>
            </header>

            <HistoryList 
              items={filteredContracts} 
              onDelete={handleDelete} 
              onDownloadPDF={handleGeneratePDF} 
              onDownloadWord={handleGenerateWord}
            />
          </div>
        )}

        {view === 'templates' && (
          <TemplateEditor />
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
          >
            <h3 className="text-xl font-serif italic text-gray-900 mb-4">¿Eliminar documento?</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Esta acción no se puede deshacer. El documento será eliminado permanentemente de la base de datos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
