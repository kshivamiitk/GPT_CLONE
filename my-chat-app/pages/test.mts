import { supabase } from '../lib/supabase';

(async () => {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');
    if (error) console.error(error);
    else console.log(profiles);
})();
