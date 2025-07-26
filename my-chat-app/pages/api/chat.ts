// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import {supabaseAdmin} from "../../lib/supabaseAdmin";

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1'
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const { message, user_id } = req.body;

    if (!user_id || !message || typeof message !== 'string') {
        return res.status(400).json({ error: 'No message provided or user_id provided' });
    }

    try {
        await supabaseAdmin.from('messages').insert([{user_id, role: 'user', content: message}]);

        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: message },
            ],
        });
        const reply = chatCompletion.choices[0].message.content;
        await supabaseAdmin.from('messages').insert([{user_id, role: 'assistant', content: reply}]);

        return res.status(200).json({ reply });
    } catch (error: any) {
        console.error('OpenAI API error:', error);
        return res.status(500).json({ error: 'OpenAI API request failed' });
    }
}
