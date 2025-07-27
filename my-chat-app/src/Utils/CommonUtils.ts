import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Dispatch, SetStateAction } from 'react';

export type Message = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

export function getTime(message: Message): string {
    return message.created_at
        ? new Date(message.created_at).toLocaleTimeString()
        : new Date().toLocaleTimeString();
}

export function checkSessionOnMount(
    setSession: Dispatch<SetStateAction<Session | null>>,
    setLoading: Dispatch<SetStateAction<boolean>>
): () => void {
    supabase.auth.getSession().then(({ data, error }) => {
        if (error) console.error('Failed to get session:', error);
        setSession(data.session ?? null);
        setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session ?? null);
        setLoading(false);
    });

    return () => {
        listener?.subscription?.unsubscribe?.();
    };
}

export async function fetchChatHistory(
    userId: string,
    setMessages: Dispatch<SetStateAction<Message[]>>
): Promise<void> {
    try {
        const res = await fetch(`/api/history?user_id=${encodeURIComponent(userId)}`);
        const { history }: { history: Message[] } = await res.json();
        setMessages(Array.isArray(history) ? history : []);
    } catch (err) {
        console.error('Failed to load history:', err);
        setMessages([]);
    }
}
