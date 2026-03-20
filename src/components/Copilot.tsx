import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Sparkles, Send, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getDoctors, getVisits } from '@/lib/store';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

export function Copilot() {
  const { role, userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I am Lomixa Copilot. How can I assist you with your platform data today?', sender: 'ai' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const generateResponse = (text: string) => {
    const q = text.toLowerCase();
    
    if (q.includes('doctor') || q.includes('how many doctors')) {
      const docs = getDoctors();
      return `There are currently ${docs.length} doctors registered on the Lomixa platform. I can help you find ones by specialty if needed!`;
    }
    
    if (q.includes('visit') || q.includes('schedule')) {
      const v = getVisits();
      const pending = v.filter(x => x.status === 'Pending').length;
      return `You have ${v.length} total visits recorded in the system, and ${pending} of them are currently pending confirmation.`;
    }

    if (q.includes('predict') || q.includes('trend')) {
      return `Based on platform-wide analytics, Cardiology is experiencing a 15% upward trend in booking requests this month. You might want to allocate more reps accordingly!`;
    }

    if (q.includes('hello') || q.includes('hi')) {
      return `Hello! I'm here to help you navigate Lomixa. Try asking me "How many doctors are there?" or "Show me visit insights."`;
    }

    return `I'm still learning about your specific data! But I can tell you about Doctors, Visits, and general Analytics trends. Try asking me about one of those.`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: 'user' }]);

    // Simulated network delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        text: generateResponse(userMsg), 
        sender: 'ai' 
      }]);
    }, 800);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform z-50 group border-2 border-white/20"
      >
        <Sparkles className="h-6 w-6 absolute opacity-0 group-hover:opacity-100 transition-opacity animate-pulse text-amber-300" />
        <Bot className="h-6 w-6 group-hover:opacity-0 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col h-[500px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 shrink-0 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Lomixa Copilot</h3>
            <p className="text-[10px] text-emerald-100 font-medium">Smart Assistant • Online</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="h-8 w-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
              msg.sender === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none shadow-sm'
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800 shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about data or analytics..."
            className="flex-1 h-10 bg-gray-100 dark:bg-slate-800 border-none rounded-xl px-4 text-sm focus:ring-2 focus:ring-emerald-500/50 dark:text-white dark:placeholder-slate-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
