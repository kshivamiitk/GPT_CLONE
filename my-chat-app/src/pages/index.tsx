// pages/index.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import chatStyles from '../styles/Chat.module.css';
import loginStyles from '../styles/Login.module.css';
import { ChatBubble } from '@/components/ChatBubble';
import {checkSessionOnMount, fetchChatHistory} from "@/Utils/CommonUtils";

type Message = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

export default function HomePage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);

    // 🔁 Check session on mount
    useEffect(() => {
        const cleanup = checkSessionOnMount(setUser, setLoading);
        return cleanup;
    }, []);

    // 🔁 Load chat history once user is known
    useEffect(() => {
        if (!user) return;
        fetchChatHistory(user.id, setMessages);
    }, [user]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        setMessages(prev => [...prev, { role: 'user', content: input, created_at: new Date().toISOString() }]);

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, message: input }),
        });

        setInput('');

        if (!res.ok) {
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        setMessages(prev => [
            ...prev,
            { role: 'assistant', content: data.reply, created_at: new Date().toISOString() },
        ]);
    };

    // 🟡 Wait for session check to complete
    if (loading) {
        return <div className={loginStyles.container}>Loading session...</div>;
    }

    // 🟢 Show login screen only when confirmed user is null
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
                <h2>ChatBot Pro</h2>
                <button onClick={handleSignOut} className={chatStyles.logoutButton}>
                    Log Out
                </button>
            </header>

            <main className={chatStyles.main}>
                {Array.isArray(messages) &&
                    messages.map((msg, idx) => (
                        <ChatBubble message={msg} key={idx} />
                    ))}
                <div ref={bottomRef} />
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
