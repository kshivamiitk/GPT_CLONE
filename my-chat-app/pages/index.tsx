// pages/index.tsx

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import chatStyles from '../styles/Chat.module.css';
import loginStyles from '../styles/Login.module.css';
import {ChatBubble} from "../components/ChatBubble";

type Message = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

export default function HomePage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<any>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);
    // Auth session & history load
    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            setUser(data?.session?.user ?? null);
        };
        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await fetch(`/api/history?user_id=${user.id}`);
                const { history } = await res.json();
                setMessages(history);
            } catch (err) {
                console.error('Failed to load history', err);
            }
        })();
    }, [user]);

    // Handlers
    const handleSignUp = async () => {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) return alert('Sign up error: ' + authError.message);

        const userId = authData.user?.id;
        if (userId) {
            const { error: profileError } = await supabase.from('profiles').insert([{ id: userId, email }]);
            if (profileError) console.error('Error inserting profile:', profileError);
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
        const { error } = await supabase.auth.signOut();
        if (error) alert('Logout error: ' + error.message);
        setMessages([]);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        const msg = input;
        setInput('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, user_id: user.id }),
            });
            const { reply } = await res.json();
            if (reply) setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    // Render
    if (!user) {
        return (
            <div className={loginStyles.container}>
                <h2>Login or Sign Up</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={loginStyles.input}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                <h2>Chat with AI</h2>
                <button onClick={handleSignOut} className={chatStyles.logoutButton}>
                    Log Out
                </button>
            </header>

            <main className={chatStyles.main}>
                {messages.map((msg, idx) => (
                    <ChatBubble message={msg} key={idx} />
                ))}
                <div ref={bottomRef}/>
            </main>

            <footer className={chatStyles.footer}>
        <textarea
            rows={2}
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className={chatStyles.textarea}
        />
                <button onClick={sendMessage} className={chatStyles.sendButton}>
                    Send
                </button>
            </footer>
        </div>
    );
}
