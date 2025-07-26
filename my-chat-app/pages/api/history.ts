// pages/api/history.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { user_id } = req.query;   // expect ?user_id=...

    if (!user_id) {
        return res.status(400).json({ error: 'Missing user_id' });
    }

    const { data, error } = await supabaseAdmin
        .from('messages')
        .select('role, content, created_at')
        .eq('user_id', user_id)
        .order('created_at', { ascending: true });


    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ history: data });
}
