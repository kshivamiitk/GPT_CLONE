// components/ChatBubble.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from '../styles/Chat.module.css';
import { Message , getTime} from "@/Utils/CommonUtils";

export function ChatBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const time = getTime(message);
    return (
        <div className={isUser ? styles.rowUser : styles.rowAI}>
            <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAI}`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                <div className={styles.timestamp}>{time}</div>
            </div>
        </div>
    );
}
