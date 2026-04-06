import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CounterGuaranteeData } from '../types';
import { useAuth } from './AuthContext';

interface DocumentContextType {
  contracts: CounterGuaranteeData[];
  saveContract: (data: CounterGuaranteeData) => Promise<string>;
  deleteContract: (id: string) => Promise<void>;
  loading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<CounterGuaranteeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = async () => {
    if (!user) {
      setContracts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('counter_guarantees')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contracts:', error);
    } else if (data) {
      const formattedContracts = data.map(d => ({
        id: d.id,
        ...d.data,
        createdAt: d.created_at
      } as CounterGuaranteeData));
      setContracts(formattedContracts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();

    if (!user) return;

    // Set up real-time subscription
    const channel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'counter_guarantees', filter: `user_id=eq.${user.id}` },
        () => {
          fetchContracts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const saveContract = async (data: CounterGuaranteeData): Promise<string> => {
    if (!user) throw new Error('No user');
    try {
      // Save parties to contacts
      const savePartyToContacts = async (party: any) => {
        if (!party.name) return;
        
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .contains('party', { name: party.name });

        if (!existingContacts || existingContacts.length === 0) {
          await supabase.from('contacts').insert({
            user_id: user.id,
            party: party
          });
        } else {
          await supabase.from('contacts').update({
            party: party,
            updated_at: new Date().toISOString()
          }).eq('id', existingContacts[0].id);
        }
      };

      await savePartyToContacts(data.principal);
      for (const guarantor of data.guarantors) {
        await savePartyToContacts(guarantor);
      }

      const { id, createdAt, ...dataToSave } = data;
      
      if (id) {
        const { error } = await supabase
          .from('counter_guarantees')
          .update({
            data: dataToSave,
            type: data.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (error) throw error;
        return id;
      } else {
        const { data: newDoc, error } = await supabase
          .from('counter_guarantees')
          .insert({
            user_id: user.id,
            type: data.type,
            data: dataToSave
          })
          .select()
          .single();
          
        if (error) throw error;
        return newDoc.id;
      }
    } catch (error) {
      console.error('Error saving contract:', error);
      throw error;
    }
  };

  const deleteContract = async (id: string) => {
    const { error } = await supabase
      .from('counter_guarantees')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  };

  return (
    <DocumentContext.Provider value={{ contracts, saveContract, deleteContract, loading }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}
