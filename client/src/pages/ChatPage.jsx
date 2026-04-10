// client/src/pages/ChatPage.jsx
// P-10: Protected AI chat — message history, send message, agent badge, typing indicator

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getChatHistory, sendMessage } from '../api/chat';

// Maps intent string to a display label and colour for the agent badge
const AGENT_BADGE = {
  visa:    { label: 'Visa agent',    color: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  health:  { label: 'Health agent',  color: 'bg-sky-400/10 text-sky-400 border-sky-400/20' },
  culture: { label: 'Culture agent', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  housing: { label: 'Housing agent', color: 'bg-rose-400/10 text-rose-400 border-rose-400/20' },
  general: { label: 'General agent', color: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
};

// Formats a timestamp to "2:34 PM"
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Loads last 30 messages from DB on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getChatHistory();
        setMessages(data);
      } catch (err) {
        setError('Could not load chat history. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Scrolls to the bottom of the message list whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Sends a message, appends user bubble immediately, then appends bot reply
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // Optimistically append the user message so the UI feels instant
    const optimisticUser = {
      _id: `optimistic-${Date.now()}`,
      role: 'user',
      message: trimmed,
      intent: 'general',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const data = await sendMessage(trimmed);
      // Replace optimistic message + add real bot reply from server
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== optimisticUser._id),
        data.userMessage,
        data.botMessage,
      ]);
    } catch (err) {
      // Remove optimistic message and show error if request fails
      setMessages((prev) => prev.filter((m) => m._id !== optimisticUser._id));
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Sends on Enter, allows Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            {'<- Dashboard'}
          </Link>
          <div className="text-center">
            <span className="text-amber-400 font-bold tracking-widest text-sm uppercase block">
              AI Assistant
            </span>
            <span className="text-slate-600 text-xs">5 specialist agents</span>
          </div>
          <div className="w-24" /> {/* spacer to keep title centred */}
        </div>
      </nav>

      {/* ── MESSAGE LIST ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

          {/* Initial loading spinner */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state — shown after load if no history */}
          {!loading && messages.length === 0 && (
            <EmptyState />
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg._id} msg={msg} />
          ))}

          {/* Typing indicator — shown while waiting for bot reply */}
          {sending && <TypingIndicator />}

          {/* Invisible anchor for auto-scroll */}
          <div ref={bottomRef} />

        </div>
      </div>

      {/* ── INPUT BAR ───────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your visa, health, housing, culture…"
              rows={1}
              className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors leading-relaxed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="shrink-0 w-11 h-11 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 flex items-center justify-center transition-colors shadow-lg shadow-amber-400/20"
            >
              {/* Send icon */}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-slate-700 text-xs mt-2 text-center">
            Enter to send {'·'} Shift+Enter for new line
          </p>
        </div>
      </div>

    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────

// Single message bubble — user on right, bot on left
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  const badge = AGENT_BADGE[msg.intent] ?? AGENT_BADGE.general;
  const time = formatTime(msg.createdAt);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xs sm:max-w-md">
          <div className="bg-amber-400 text-slate-950 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed font-medium">
            {msg.message}
          </div>
          <p className="text-slate-700 text-xs mt-1 text-right">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-xs sm:max-w-md">
        {/* Bot avatar + bubble */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0 mt-0.5">
            🤖
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-slate-200">
            {msg.message}
          </div>
        </div>
        {/* Agent badge + timestamp */}
        <div className="flex items-center gap-2 mt-1.5 ml-11">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-slate-700 text-xs">{time}</span>
        </div>
      </div>
    </div>
  );
};

// Animated three-dot typing indicator shown while bot is responding
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
        🤖
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// Empty state shown when user has no chat history yet
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl mb-4">
      🤖
    </div>
    <h2 className="text-white font-bold text-lg mb-2">Ask me anything</h2>
    <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-6">
      I have specialist agents for visa, health, culture, and housing — or just ask a general question.
    </p>
    <div className="flex flex-wrap justify-center gap-2">
      {[
        'What visa do I need?',
        'Which vaccines should I get?',
        'How much does rent cost?',
        'What are local customs?',
      ].map((suggestion) => (
        <SuggestionChip key={suggestion} label={suggestion} />
      ))}
    </div>
  </div>
);

// Suggestion chip in the empty state — clicking pre-fills the input
const SuggestionChip = ({ label }) => {
  // Chips need to communicate up to the input — we use a custom event
  // so SuggestionChip doesn't need props drilling through EmptyState
  const handleClick = () => {
    const event = new CustomEvent('suggestion', { detail: label });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleClick}
      className="bg-slate-900 border border-slate-700 hover:border-amber-400/40 hover:text-amber-400 text-slate-300 text-xs px-3 py-1.5 rounded-full transition-colors"
    >
      {label}
    </button>
  );
};

export default ChatPage;