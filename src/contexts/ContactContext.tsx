import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PartyDetails } from '../types';
import { useAuth } from './AuthContext';

export interface ContactData {
  id: string;
  userId: string;
  party: PartyDetails;
  createdAt: string;
}

interface ContactContextType {
  contacts: ContactData[];
  saveContact: (party: PartyDetails) => Promise<string>;
  deleteContact: (id: string) => Promise<void>;
  loading: boolean;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
    } else if (data) {
      const formattedContacts = data.map(d => ({
        id: d.id,
        userId: d.user_id,
        party: d.party as PartyDetails,
        createdAt: d.created_at
      }));
      setContacts(formattedContacts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();

    if (!user) return;

    // Set up real-time subscription
    const channel = supabase.channel('custom-contacts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts', filter: `user_id=eq.${user.id}` },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const saveContact = async (party: PartyDetails): Promise<string> => {
    if (!user) throw new Error('No user');
    try {
      // Check if contact with same name already exists to update instead of duplicate
      const existingContact = contacts.find(c => c.party.name.toLowerCase() === party.name.toLowerCase());
      
      if (existingContact) {
        const { error } = await supabase
          .from('contacts')
          .update({
            party,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContact.id);
          
        if (error) throw error;
        return existingContact.id;
      } else {
        const { data: newDoc, error } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            party
          })
          .select()
          .single();
          
        if (error) throw error;
        return newDoc.id;
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  };

  return (
    <ContactContext.Provider value={{ contacts, saveContact, deleteContact, loading }}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactContext);
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
}
