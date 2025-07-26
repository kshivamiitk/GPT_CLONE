// components/ChatBubble.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/Chat.module.css';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
};

export function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const time = message.created_at
        ? new Date(message.created_at).toLocaleTimeString()
        : new Date().toLocaleTimeString();

    return (
        <div className={isUser ? styles.rowUser : styles.rowAI}>
            <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAI}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                <div className={styles.timestamp}>{time}</div>
            </div>
        </div>
    );
}
