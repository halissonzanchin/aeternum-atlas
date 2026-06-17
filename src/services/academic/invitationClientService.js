import { supabase } from "../../lib/supabase";

/**
 * Service to call the Supabase Edge Function 'invite-users'.
 * It chunks users into batches of 50 to avoid timeout/rate limits.
 */
export async function inviteUsersInBatches(institutionId, newUsers) {
  const result = {
    invited: 0,
    already_exists: 0,
    failed: 0,
    errors: [],
  };

  if (!newUsers || newUsers.length === 0) return result;

  // Garantir que chamamos com o JWT atual da sessão
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.access_token) {
    result.failed += newUsers.length;
    result.errors.push({ email: "Geral", reason: "Sessão não encontrada para chamar Edge Function." });
    return result;
  }

  const token = session.access_token;
  const BATCH_SIZE = 50;

  // Remove duplicates from the newUsers array before sending
  const uniqueUsersMap = new Map();
  newUsers.forEach(u => uniqueUsersMap.set(u.email.toLowerCase(), u));
  const uniqueUsers = Array.from(uniqueUsersMap.values());

  for (let i = 0; i < uniqueUsers.length; i += BATCH_SIZE) {
    const chunk = uniqueUsers.slice(i, i + BATCH_SIZE);
    
    try {
      // Usar a URL dinâmica do Supabase do projeto, ajustando localhost ou nuvem
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
      // Ajuste de rota: funções edge rodam em /functions/v1/ (nuvem)
      const functionUrl = supabaseUrl.includes('localhost') 
          ? `${supabaseUrl}/functions/v1/invite-users`
          : `${supabaseUrl}/functions/v1/invite-users`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_id: institutionId,
          users: chunk.map(u => ({
            email: u.email,
            name: u.name,
            role: "student" // Simplificado para student por enquanto
          }))
        })
      });

      if (!response.ok) {
        // Fallback or generic error if function fails (e.g. 500)
        const errorText = await response.text();
        result.failed += chunk.length;
        result.errors.push({ email: "Lote " + (i/BATCH_SIZE + 1), reason: `Edge Function falhou: ${response.status} - ${errorText}` });
        continue;
      }

      const data = await response.json();
      result.invited += data.invited || 0;
      result.already_exists += data.already_exists || 0;
      result.failed += data.failed || 0;
      
      if (data.errors && data.errors.length > 0) {
        result.errors = [...result.errors, ...data.errors];
      }

    } catch (err) {
      result.failed += chunk.length;
      result.errors.push({ email: "Lote " + (i/BATCH_SIZE + 1), reason: `Erro de rede ao chamar Edge Function: ${err.message}` });
    }
  }

  return result;
}
