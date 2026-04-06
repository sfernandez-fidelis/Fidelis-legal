import React, { useState, useEffect } from 'react';
import { User, Briefcase, Search, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PartyDetails } from '../../types';
import { useContacts } from '../../contexts/ContactContext';

interface Props {
  party: PartyDetails;
  onChange: (updated: PartyDetails) => void;
  title: string;
  onRemove?: () => void;
}

export default function PartyForm({ party, onChange, title, onRemove }: Props) {
  const { contacts } = useContacts();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dpiError, setDpiError] = useState('');
  const [actaWarning, setActaWarning] = useState('');
  const [autoFillSuggestion, setAutoFillSuggestion] = useState<PartyDetails | null>(null);

  const filteredContacts = contacts.filter(c => 
    c.party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.party.entityName && c.party.entityName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectContact = (contactParty: PartyDetails) => {
    onChange(contactParty);
    setShowSearch(false);
    setSearchTerm('');
    setAutoFillSuggestion(null);
  };

  // Auto-fill logic based on DPI or Entity Name
  useEffect(() => {
    if (party.idNumber && party.idNumber.length === 13) {
      const match = contacts.find(c => c.party.idNumber === party.idNumber && c.party.name !== party.name);
      if (match) {
        setAutoFillSuggestion(match.party);
      } else {
        setAutoFillSuggestion(null);
      }
    } else if (party.entityName && party.entityName.length > 5) {
      const match = contacts.find(c => c.party.entityName?.toLowerCase() === party.entityName?.toLowerCase() && c.party.name !== party.name);
      if (match) {
        setAutoFillSuggestion(match.party);
      } else {
        setAutoFillSuggestion(null);
      }
    } else {
      setAutoFillSuggestion(null);
    }
  }, [party.idNumber, party.entityName, contacts]);

  // DPI Validation
  useEffect(() => {
    if (party.idNumber && party.idNumber.length > 0) {
      if (party.idNumber.length !== 13) {
        setDpiError('El DPI debe tener exactamente 13 dígitos.');
      } else {
        setDpiError('');
      }
    } else {
      setDpiError('');
    }
  }, [party.idNumber]);

  // Expiration Warning (Acta Notarial)
  useEffect(() => {
    if (party.isRepresenting && party.actDate) {
      const actDate = new Date(party.actDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - actDate.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      
      if (diffYears > 3) {
        setActaWarning('El acta notarial tiene más de 3 años. Verifique su vigencia.');
      } else {
        setActaWarning('');
      }
    } else {
      setActaWarning('');
    }
  }, [party.actDate, party.isRepresenting]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-100 shadow-sm relative">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <User className="text-brand-600" size={18} />
          {title}
        </h4>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <Search size={14} /> Buscar Contacto
          </button>
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${party.isRepresenting ? 'bg-brand-600' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${party.isRepresenting ? 'left-6' : 'left-1'}`} />
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={party.isRepresenting}
              onChange={(e) => onChange({ ...party, isRepresenting: e.target.checked })}
            />
            <span className="text-xs font-medium text-gray-600 group-hover:text-brand-600 transition-colors">¿Representa a una entidad?</span>
          </label>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-gray-400 hover:text-red-600 transition-colors ml-2"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o entidad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" 
            />
          </div>
          {searchTerm && (
            <div className="max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectContact(c.party)}
                    className="w-full text-left px-4 py-2 hover:bg-brand-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">{c.party.name}</p>
                    {c.party.entityName && <p className="text-xs text-gray-500">{c.party.entityName}</p>}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-xs text-gray-500 text-center">No se encontraron contactos.</p>
              )}
            </div>
          )}
        </div>
      )}

      {autoFillSuggestion && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start justify-between animate-in fade-in">
          <div className="flex gap-3">
            <div className="mt-0.5 text-blue-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Contacto encontrado en la base de datos</p>
              <p className="text-xs text-blue-700 mt-1">
                ¿Deseas autocompletar los datos con la información de <strong>{autoFillSuggestion.name}</strong>?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAutoFillSuggestion(null)}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
            >
              Ignorar
            </button>
            <button
              type="button"
              onClick={() => handleSelectContact(autoFillSuggestion)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              Autocompletar
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
          <input
            type="text"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            value={party.name}
            onChange={(e) => onChange({ ...party, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Edad (Número)</label>
          <input
            type="number"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            value={party.age}
            onChange={(e) => onChange({ ...party, age: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado Civil</label>
          <select
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            value={party.maritalStatus}
            onChange={(e) => onChange({ ...party, maritalStatus: e.target.value })}
          >
            <option value="soltero">Soltero</option>
            <option value="casado">Casado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Profesión</label>
          <input
            type="text"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            value={party.profession}
            onChange={(e) => onChange({ ...party, profession: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Domicilio (Departamento)</label>
          <input
            type="text"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
            value={party.domicile}
            onChange={(e) => onChange({ ...party, domicile: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">DPI / CUI (13 dígitos sin espacios)</label>
          <input
            type="text"
            maxLength={13}
            className={`w-full p-2.5 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-mono ${dpiError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
            value={party.idNumber}
            onChange={(e) => onChange({ ...party, idNumber: e.target.value.replace(/\D/g, '') })}
            placeholder="Ej: 1965878401501"
          />
          {dpiError && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle size={12} /> {dpiError}
            </p>
          )}
        </div>
      </div>

      {party.isRepresenting && (
        <div className="mt-6 p-6 bg-brand-50/50 rounded-xl border border-brand-100 space-y-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-bold text-brand-800 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={16} />
            Datos de la Entidad y Representación
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Nombre de la Entidad</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                value={party.entityName}
                onChange={(e) => onChange({ ...party, entityName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Calidad (Cargo)</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                value={party.role}
                onChange={(e) => onChange({ ...party, role: e.target.value })}
                placeholder="Ej: Administrador Único"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Notario</label>
              <input
                type="text"
                className="w-full p-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                value={party.notaryName}
                onChange={(e) => onChange({ ...party, notaryName: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Fecha de Acta</label>
              <input
                type="date"
                className={`w-full p-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all ${actaWarning ? 'border-amber-300 focus:ring-amber-500' : 'border-brand-200'}`}
                value={party.actDate}
                onChange={(e) => onChange({ ...party, actDate: e.target.value })}
              />
              {actaWarning && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> {actaWarning}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Registro</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  value={party.regNumber}
                  onChange={(e) => onChange({ ...party, regNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Folio</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  value={party.regFolio}
                  onChange={(e) => onChange({ ...party, regFolio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">Libro</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-white border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                  value={party.regBook}
                  onChange={(e) => onChange({ ...party, regBook: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
