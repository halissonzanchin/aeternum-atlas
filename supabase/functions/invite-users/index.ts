import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Extrair JWT do chamador para validar permissões
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables.");
    }

    // Cliente comum apenas para ler o token de quem fez o request
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Validação de Perfil do Chamador
    const callerRole = user.user_metadata?.role;
    const callerInstitution = user.user_metadata?.institutionId || user.user_metadata?.institution_id;

    if (callerRole !== "super_admin" && callerRole !== "institution_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Caller is not an admin." }), { 
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 3. Receber Payload
    const body = await req.json();
    const { users, institution_id } = body;

    if (!institution_id) {
      throw new Error("Missing institution_id in payload.");
    }

    if (!Array.isArray(users) || users.length === 0) {
      throw new Error("Missing or empty users array.");
    }

    if (users.length > 500) {
      throw new Error("Max batch size exceeded. Limit is 500.");
    }

    // Regra Multi-Tenant: Admin só convida pra sua própria instituição
    if (callerRole === "institution_admin" && callerInstitution !== institution_id) {
      return new Response(JSON.stringify({ error: "Forbidden: Cannot invite users to a different institution." }), { 
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 4. Instanciar Admin Client para poder usar service_role (Nunca enviada ao browser)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const report = {
      invited: 0,
      already_exists: 0,
      failed: 0,
      total: users.length,
      errors: [] as any[],
    };

    // 5. Processamento em Lote
    for (const u of users) {
      const { email, name, role } = u;

      if (!email || !name) {
        report.failed++;
        report.errors.push({ email, reason: "Missing email or name." });
        continue;
      }

      const validRoles = ["student", "teacher"];
      const userRole = validRoles.includes(role) ? role : "student";

      try {
        // Dispara o convite silencioso
        const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            name: name,
            role: userRole,
            institution_id: institution_id,
          },
        });

        // Supabase retorna erro se o e-mail já existir
        if (inviteErr) {
          if (inviteErr.message.includes("already registered") || inviteErr.status === 422) {
            report.already_exists++;
          } else {
            report.failed++;
            report.errors.push({ email, reason: inviteErr.message });
          }
          continue;
        }

        const newUserId = inviteData.user.id;

        // Upsert na tabela public.users (Para garantir que aparece nos dashboards antes mesmo de aceitar)
        const { error: upsertErr } = await adminClient.from("users").upsert({
          id: newUserId,
          email: email.toLowerCase(),
          name: name,
          role: userRole,
          institution_id: institution_id,
          status: "pending", // Campo opcional que indica que a senha ainda não foi setada
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

        if (upsertErr) {
           // Apenas logamos internamente, o convite em si já foi
           console.warn(`Could not sync public.users for ${email}:`, upsertErr.message);
        }

        report.invited++;
      } catch (err: any) {
        report.failed++;
        report.errors.push({ email, reason: err.message });
      }
    }

    // 6. Retornar Relatório
    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    // Log seguro
    console.error("Invite-users Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
