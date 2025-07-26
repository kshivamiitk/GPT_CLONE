import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

export default function HomePage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<any>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

    // On mount, check auth session
    useEffect(() => {
        const getSession = async () => {
            const { data } = await supabase.auth.getSession();
            setUser(data?.session?.user ?? null);
        };

        getSession();

        const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    // Handle signup
    const handleSignUp = async () => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) alert(error.message);
    };

    // Handle login
    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
    };

    // Handle anonymous login
    const handleAnonLogin = async () => {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) alert(error.message);
    };

    // Handle logout
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setMessages([]);
    };

    // Send message to OpenAI API
    const sendMessage = async () => {
        if (input.trim() === '') return;

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        const msg = input;
        setInput('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg }),
            });
            const data = await res.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    // If not logged in, show login form
    if (!user) {
        return (
            <div style={{ maxWidth: 400, margin: '50px auto', fontFamily: 'sans-serif' }}>
                <h2>Login or Sign Up</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={handleSignUp} style={{ width: '48%' }}>Sign Up</button>
                    <button onClick={handleSignIn} style={{ width: '48%' }}>Sign In</button>
                </div>
                <button onClick={handleAnonLogin} style={{ width: '100%', marginTop: '10px' }}>
                    Continue as Guest
                </button>
            </div>
        );
    }

    // If logged in, show chat interface
    return (
        <div style={{ maxWidth: 600, margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2>Chat with GPT</h2>
            <button onClick={handleSignOut} style={{ marginBottom: '20px' }}>Log Out</button>

            <div style={{ marginBottom: '20px', height: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                        <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong>
                        <div style={{
                            background: msg.role === 'user' ? '#eef' : '#fee',
                            padding: '8px',
                            borderRadius: '4px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>

            <textarea
                rows={3}
                placeholder="Type your message..."
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ width: '100%', marginBottom: '8px', padding: '8px' }}
            />
            <button onClick={sendMessage} style={{ width: '100%' }}>Send</button>
        </div>
    );
}
