"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Send, Bot, UserRound, Clock, MessageSquare } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Contact = {
  id: string;
  username: string;
  avatar_url?: string;
  tags: string[];
  last_interaction_at: string;
};

type Message = {
  id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  message_body: string;
  created_at: string;
};

export default function InboxPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [humanOverride, setHumanOverride] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial contacts
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_interaction_at', { ascending: false });
      
      if (data) {
        setContacts(data);
        if (data.length > 0) setSelectedContact(data[0]);
      } else {
        console.error("Error fetching contacts", error);
      }
    };
    fetchContacts();
  }, []);

  // Fetch messages for selected contact & subscribe to real-time updates
  useEffect(() => {
    if (!selectedContact) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', selectedContact.id)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to new messages for this specific contact
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `contact_id=eq.${selectedContact.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim() || !selectedContact) return;

    // Optimistic UI update
    const newMessage: Message = {
      id: `temp_${Date.now()}`,
      contact_id: selectedContact.id,
      direction: 'outbound',
      message_body: replyText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setReplyText("");

    // Insert into Supabase - the Edge function would ideally pick this up or we hit Meta directly via API route
    await supabase.from('conversations').insert({
      contact_id: selectedContact.id,
      direction: 'outbound',
      message_body: newMessage.message_body,
    });
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] border rounded-xl overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 m-4 shadow-sm">
      
      {/* Left Panel: Contacts List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950 shrink-0">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 font-semibold text-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
          Live Inbox
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${
                selectedContact?.id === contact.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-slate-500" />
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {contact.username || 'Unknown User'}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock size={12} />
                  {contact.last_interaction_at ? new Date(contact.last_interaction_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </div>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">
              No contacts found.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Window */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                   <User size={16} className="text-slate-500" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{selectedContact.username || 'Unknown User'}</div>
                  <div className="flex gap-1 mt-0.5">
                    {selectedContact.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded-full text-slate-600 dark:text-slate-400 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setHumanOverride(!humanOverride)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border shadow-sm ${
                  humanOverride 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' 
                    : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {humanOverride ? <UserRound size={16} /> : <Bot size={16} />}
                {humanOverride ? 'Human Override' : 'Bot Active'}
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                        msg.direction === 'outbound' 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {msg.message_body}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={humanOverride ? "Type a message..." : "Bot is active. Type to take over..."}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 rounded-lg px-4 py-2.5 outline-none transition-all dark:text-white text-sm"
                  onFocus={() => !humanOverride && setHumanOverride(true)}
                />
                <button 
                  onClick={handleSend}
                  disabled={!replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-2.5 px-5 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-slate-400">
            <MessageSquare size={48} className="text-slate-300 dark:text-slate-700" />
            <p>Select a contact to view conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
