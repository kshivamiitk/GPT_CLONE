// pages/api/history.ts
import { supabase } from '../../lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { user_id } = req.query;

    if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing user_id' });
    }

    const { data, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ history: data });
}
