import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import chatStyles from '../styles/Chat.module.css';
import loginStyles from '../styles/Login.module.css';
import { ChatBubble } from '@/components/ChatBubble';
import { checkSessionOnMount, fetchChatHistory } from '@/Utils/CommonUtils';
import type { Message } from '@/Utils/CommonUtils';

export default function HomePage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);

    // 🔁 Check session on mount
    useEffect(() => {
        const cleanup = checkSessionOnMount(setSession, setLoading);
        return cleanup;
    }, []);

    // 🔁 Load chat history once we have a session
    useEffect(() => {
        if (session) {
            fetchChatHistory(session.user.id, setMessages);
        }
    }, [session]);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSignUp = async () => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return alert('Sign up error: ' + error.message);

        const userId = data.user?.id;
        if (userId) {
            const { error: profileError } = await supabase.from('profiles').insert([
                { id: userId, email },
            ]);
            if (profileError) console.error(profileError);
        }
        alert('Check your email to confirm your account!');
    };

    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert('Sign in error: ' + error.message);
    };

    const handleAnonLogin = async () => {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) alert('Anonymous login error: ' + error.message);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setMessages([]);
    };

    const sendMessage = async () => {
        if (!input.trim() || !session) return;

        // Optimistically add the user message
        setMessages((prev) => [
            ...prev,
            { role: 'user', content: input, created_at: new Date().toISOString() },
        ]);

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: session.user.id, message: input }),
        });
        setInput('');

        if (!res.ok) {
            console.error('Chat API error:', await res.text());
            return;
        }
        const { reply }: { reply: string } = await res.json();
        setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: reply, created_at: new Date().toISOString() },
        ]);
    };

    if (loading) {
        return <div className={loginStyles.container}>Loading session...</div>;
    }

    if (!session) {
        return (
            <div className={loginStyles.container}>
                <h2>Login or Sign Up</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={loginStyles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={loginStyles.input}
                />
                <div className={loginStyles.buttonRow}>
                    <button onClick={handleSignUp} className={loginStyles.button}>
                        Sign Up
                    </button>
                    <button onClick={handleSignIn} className={loginStyles.button}>
                        Sign In
                    </button>
                </div>
                <button onClick={handleAnonLogin} className={loginStyles.guestButton}>
                    Continue as Guest
                </button>
            </div>
        );
    }

    return (
        <div className={chatStyles.container}>
            <header className={chatStyles.header}>
                <h2>ChatBot Pro</h2>
                <button onClick={handleSignOut} className={chatStyles.logoutButton}>
                    Log Out
                </button>
            </header>

            <main className={chatStyles.main}>
                {messages.map((msg, idx) => (
                    <ChatBubble message={msg} key={idx} />
                ))}
                <div ref={bottomRef} />
            </main>

            <footer className={chatStyles.footer}>
        <textarea
            rows={2}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={chatStyles.textarea}
        />
                <button onClick={sendMessage} className={chatStyles.sendButton}>
                    Send
                </button>
            </footer>
        </div>
    );
}
