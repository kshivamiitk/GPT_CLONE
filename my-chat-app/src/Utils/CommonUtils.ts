import {useEffect} from "react";
import {supabase} from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type Message = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

export function getTime(message: Message) {
    const time = message.created_at
        ? new Date(message.created_at).toLocaleTimeString()
        : new Date().toLocaleTimeString();
    return time;
}

export function checkSessionOnMount(
    setUser: (user: User | null) => void,
    setLoading: (loading: boolean) => void
): () => void {
    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error('Failed to get session:', error);
        }
        setUser(data?.session?.user ?? null);
        setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
    });

    return () => {
        listener?.subscription?.unsubscribe?.(); // for safety
    };
}

export async function fetchChatHistory(userId: string, setMessages: (messages: any[]) => void) {
    try {
        const res = await fetch(`/api/history?user_id=${userId}`);
        const { history } = await res.json();
        setMessages(Array.isArray(history) ? history : []);
    } catch (err) {
        console.error('Failed to load history:', err);
        setMessages([]);
    }
}
