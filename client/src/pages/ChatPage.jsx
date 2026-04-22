// client/src/pages/ChatPage.jsx
// P-10: Protected AI chat — message history, send message, agent badge, streaming

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getChatHistory } from '../api/chat';
import socket from '../api/socket';

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

// Sentinel _id used to identify the in-progress streaming bubble in the messages array
const STREAMING_ID = 'streaming-bot-bubble';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const MAX_LENGTH = 2000;
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Loads last 30 messages from DB on mount via REST (unchanged from Phase 1)
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

  // ── Socket event listeners ─────────────────────────────────────────────────
  // Registered once on mount, cleaned up on unmount.
  // Each handler is a stable function reference — no dependencies on state
  // that would cause re-registration on every render.
  useEffect(() => {
    // chat:token — a new piece of the bot's response has arrived.
    // If the streaming bubble already exists in the messages array, append the
    // token to its message string. If it doesn't exist yet (this is the first
    // token), hide the typing indicator and create the bubble with this token.
    const handleToken = ({ token }) => {
      setSending(false); // first token arrives — hide the typing indicator
      setMessages((prev) => {
        const existing = prev.find((m) => m._id === STREAMING_ID);
        if (existing) {
          // Append the new token to the existing streaming bubble
          return prev.map((m) =>
            m._id === STREAMING_ID
              ? { ...m, message: m.message + token }
              : m
          );
        }
        // First token — create the streaming bubble
        return [
          ...prev,
          {
            _id: STREAMING_ID,
            role: 'bot',
            message: token,
            intent: 'general', // placeholder until chat:done provides the real intent
            createdAt: new Date().toISOString(),
            streaming: true,
          },
        ];
      });
    };

    // chat:done — the stream has finished and both messages are saved in MongoDB.
    // Replace the temporary streaming bubble with the real saved bot document
    // so it has a real _id, correct intent, and accurate createdAt timestamp.
    const handleDone = ({ intent, savedBotMessage }) => {
      setMessages((prev) => [
        ...prev.filter((m) => m._id !== STREAMING_ID),
        { ...savedBotMessage, intent },
      ]);
      setSending(false);
      inputRef.current?.focus();
    };

    // chat:error — something failed on the server after the message was sent.
    // Remove the optimistic user bubble and the streaming bubble (if any),
    // and show the error banner.
    const handleError = ({ message }) => {
      setMessages((prev) =>
        prev.filter(
          (m) => !m._id?.startsWith('optimistic-') && m._id !== STREAMING_ID
        )
      );
      setSending(false);
      setError(message || 'Failed to send message. Please try again.');
      inputRef.current?.focus();
    };

    socket.on('chat:token', handleToken);
    socket.on('chat:done', handleDone);
    socket.on('chat:error', handleError);

    return () => {
      socket.off('chat:token', handleToken);
      socket.off('chat:done', handleDone);
      socket.off('chat:error', handleError);
    };
  }, []); // empty deps — handlers use functional setState, never read stale state

  // Scrolls to the bottom whenever the message list or sending state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Suggestion chip custom event — pre-fills the input box
  useEffect(() => {
    const handler = (e) => setInput(e.detail);
    window.addEventListener('suggestion', handler);
    return () => window.removeEventListener('suggestion', handler);
  }, []);

  // Sends the message via socket instead of Axios.
  // Optimistic user bubble is added immediately — same pattern as Phase 1.
  // The typing indicator (sending === true) shows until the first chat:token arrives.
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    // Append optimistic user bubble
    const optimisticUser = {
      _id: `optimistic-${Date.now()}`,
      role: 'user',
      message: trimmed,
      intent: 'general',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput('');
    setSending(true); // shows typing indicator until first token
    setError('');

    // Emit to the server — chatSocket.js handles classification, streaming, and saving
    socket.emit('chat:message', { message: trimmed });
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
          <div className="w-24" />
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

          {/* Messages — streaming bubble renders via MessageBubble with streaming prop */}
          {messages.map((msg) => (
            <MessageBubble key={msg._id} msg={msg} />
          ))}

          {/* Typing indicator — shown only before the first token arrives */}
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
              maxLength={MAX_LENGTH}
              className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors leading-relaxed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || input.length > MAX_LENGTH}
              className="shrink-0 w-11 h-11 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 flex items-center justify-center transition-colors shadow-lg shadow-amber-400/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          {/* Character counter — only appears when approaching the limit */}
          {input.length > MAX_LENGTH * 0.8 && (
            <p className={`text-xs text-right mt-1 ${
              input.length >= MAX_LENGTH ? 'text-red-400' : 'text-slate-500'
            }`}>
              {input.length}/{MAX_LENGTH}
            </p>
          )}
          <p className="text-slate-700 text-xs mt-2 text-center">
            Enter to send {'·'} Shift+Enter for new line
          </p>
        </div>
      </div>

    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────

// Single message bubble — user on right, bot on left.
// When msg.streaming is true, a blinking cursor is shown at the end of the text
// to indicate the response is still being typed out.
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
            {/* Blinking cursor shown while tokens are still arriving */}
            {msg.streaming && (
              <span className="inline-block w-0.5 h-3.5 bg-amber-400 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        </div>
        {/* Agent badge + timestamp — badge shows placeholder colour while streaming */}
        <div className="flex items-center gap-2 mt-1.5 ml-11">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
            {badge.label}
          </span>
          {!msg.streaming && (
            <span className="text-slate-700 text-xs">{time}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Animated three-dot typing indicator — shown only before the first token arrives
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

// Suggestion chip in the empty state — clicking pre-fills the input box
const SuggestionChip = ({ label }) => {
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