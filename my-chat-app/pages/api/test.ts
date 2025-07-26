// pages/api/test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const test = await openai.models.list();
        res.status(200).json(test);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'OpenAI failed' });
    }
}
