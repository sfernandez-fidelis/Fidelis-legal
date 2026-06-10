import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exjlrujanhtxycmveihg.supabase.co';
const supabaseAnonKey = 'sb_publishable_woRUl6rjinuY8Ysycpgtww_dlyxr1DP';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    console.log('Testing agents list...');
    const { data: allAgents, error: err1 } = await supabase
      .from('insurance_agents')
      .select('*')
      .limit(5);
    console.log('Sample agents:', allAgents, err1);

    console.log('Testing search with cuchu...');
    const { data: searchAgents, error: err2 } = await supabase
      .from('insurance_agents')
      .select('*')
      .or('full_name.ilike.%cuchu%,code.ilike.%cuchu%');
    console.log('Search results:', searchAgents, err2);
  } catch (e) {
    console.error('Exception:', e);
  }
}

main();
