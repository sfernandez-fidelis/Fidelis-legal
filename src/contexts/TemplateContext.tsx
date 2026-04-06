import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ContractType } from '../types';
import { useAuth } from './AuthContext';

interface TemplateData {
  id: string;
  type: ContractType;
  content: string;
  updatedAt: string;
}

interface TemplateContextType {
  templates: TemplateData[];
  saveTemplate: (type: ContractType, content: string) => Promise<void>;
  getTemplate: (type: ContractType) => TemplateData | undefined;
  loading: boolean;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*');

    if (error) {
      console.error('Error fetching templates:', error);
    } else if (data) {
      const formattedTemplates = data.map(d => ({
        id: d.id,
        type: d.type as ContractType,
        content: d.content,
        updatedAt: d.updated_at
      }));
      setTemplates(formattedTemplates);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();

    // Set up real-time subscription
    const channel = supabase.channel('custom-templates-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'templates' },
        () => {
          fetchTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveTemplate = async (type: ContractType, content: string) => {
    if (!user) throw new Error('No user');
    try {
      // Check if template exists
      const { data: existing } = await supabase
        .from('templates')
        .select('id')
        .eq('type', type)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('templates')
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('templates')
          .insert({
            type,
            content
          });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const getTemplate = (type: ContractType) => {
    return templates.find(t => t.type === type);
  };

  return (
    <TemplateContext.Provider value={{ templates, saveTemplate, getTemplate, loading }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}
