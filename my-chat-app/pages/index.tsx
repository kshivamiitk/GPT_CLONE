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
        return () => listener.subscription.unsubscribe();
    }, []);

    // Handle signup
    // pages/index.tsx (inside HomePage component)
    const handleSignUp = async () => {
        // 1) Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) {
            alert('Sign up error: ' + authError.message);
            return;
        }

        // 2) Immediately insert a profile row for this user
        const userId = authData.user?.id;
        if (userId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: userId, email }]);
            if (profileError) {
                console.error('Error inserting profile:', profileError);
            }
        }

        alert('Check your email to confirm your account!');
    };


    // Handle login
    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert('Sign in error: ' + error.message);
    };

    // Handle anonymous login
    const handleAnonLogin = async () => {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) alert('Anonymous login error: ' + error.message);
    };

    // Handle logout
    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) alert('Logout error: ' + error.message);
        setMessages([]);
    };

    // Send message to API
    const sendMessage = async () => {
        if (!input.trim()) return;
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
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100vw',
                    height: '100vh',
                    padding: '20px',
                    boxSizing: 'border-box',
                    background: '#f5f5f5',
                }}
            >
                <h2>Login or Sign Up</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', maxWidth: 400, margin: '8px 0', padding: '10px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', maxWidth: 400, margin: '8px 0', padding: '10px' }}
                />
                <div style={{ display: 'flex', gap: '10px', margin: '8px 0' }}>
                    <button onClick={handleSignUp} style={{ flex: 1, padding: '10px' }}>
                        Sign Up
                    </button>
                    <button onClick={handleSignIn} style={{ flex: 1, padding: '10px' }}>
                        Sign In
                    </button>
                </div>
                <button
                    onClick={handleAnonLogin}
                    style={{ width: '100%', maxWidth: 400, marginTop: '10px', padding: '10px' }}
                >
                    Continue as Guest
                </button>
            </div>
        );
    }

    // If logged in, show chat interface
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                width: '100vw',
                boxSizing: 'border-box',
            }}
        >
            <header
                style={{
                    padding: '10px 20px',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fafafa',
                }}
            >
                <h2>Chat with GPT</h2>
                <button onClick={handleSignOut} style={{ padding: '8px 12px' }}>
                    Log Out
                </button>
            </header>

            <main
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    background: '#fff',
                }}
            >
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '16px' }}>
                        <strong>{msg.role === 'user' ? 'You:' : 'AI:'}</strong>
                        <div
                            style={{
                                background: msg.role === 'user' ? '#eef' : '#fee',
                                padding: '12px',
                                borderRadius: '6px',
                                whiteSpace: 'pre-wrap',
                                marginTop: '4px',
                            }}
                        >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </main>

            <footer
                style={{
                    padding: '10px 20px',
                    borderTop: '1px solid #ddd',
                    background: '#fafafa',
                }}
            >
        <textarea
            rows={2}
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
        />
                <button
                    onClick={sendMessage}
                    style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '12px',
                        background: '#0070f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                    }}
                >
                    Send
                </button>
            </footer>
        </div>
    );
}
