import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TokenRequest {
  action: "verify_email" | "reset_password" | "generate_verification" | "generate_reset" | "get_security_status";
  token?: string;
  newPassword?: string;
  userId?: string;
  email?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashToken(token: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json() as TokenRequest;
    const { action, token, newPassword, userId, email } = body;

    if (!action) {
      throw new Error("Missing action field");
    }

    if (action === "get_security_status") {
      if (!userId) throw new Error("userId required");
      const { data, error } = await supabase
        .from('user_security')
        .select('email_verified')
        .eq('user_id', userId)
        .maybeSingle();
      
      return new Response(JSON.stringify({ success: true, verified: data?.email_verified || false }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 200,
      });
    }

    if (action === "verify_email") {
      if (!token) throw new Error("Token required");
      
      const hashedToken = await hashToken(token);
      
      const { data, error } = await supabase
        .from('user_security')
        .select('*')
        .eq('verification_token', hashedToken)
        .single();
        
      if (error || !data) {
        throw new Error("Invalid or expired verification token.");
      }
      
      if (new Date(data.token_expiry) < new Date()) {
        throw new Error("Verification token has expired.");
      }

      const { error: updateError } = await supabase
        .from('user_security')
        .update({ 
          email_verified: true,
          verification_token: null,
          token_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) throw updateError;
      
      return new Response(JSON.stringify({ success: true, message: "Email verified successfully" }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 200,
      });
    }

    if (action === "reset_password") {
      if (!token || !newPassword) throw new Error("Token and new password required");

      const hashedToken = await hashToken(token);

      const { data, error } = await supabase
        .from('user_security')
        .select('*')
        .eq('reset_token', hashedToken)
        .single();
        
      if (error || !data) {
        throw new Error("Invalid or expired reset token.");
      }
      
      if (new Date(data.token_expiry) < new Date()) {
        throw new Error("Reset token has expired.");
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(
        data.user_id,
        { password: newPassword }
      );

      if (authError) throw authError;

      await supabase
        .from('user_security')
        .update({ 
          reset_token: null,
          token_expiry: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return new Response(JSON.stringify({ success: true, message: "Password updated successfully" }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 200,
      });
    }

    if (action === "generate_verification" || action === "generate_reset") {
      if (!email && !userId) throw new Error("Email or userId required to generate tokens");

      let finalUserId = userId;
      let finalEmail = email;
      let lastResend: string | null = null;

      if (!finalUserId && email) {
        const { data: existingUser, error: lookupError } = await supabase
          .from('user_security')
          .select('user_id, email, last_resend_at')
          .eq('email', email)
          .maybeSingle();
        
        if (lookupError) throw lookupError;
        if (!existingUser) throw new Error("User not found for this email address.");
        finalUserId = existingUser.user_id;
        finalEmail = existingUser.email;
        lastResend = existingUser.last_resend_at;
      } else if (finalUserId) {
        const { data: existingUser, error: lookupError } = await supabase
          .from('user_security')
          .select('email, last_resend_at')
          .eq('user_id', finalUserId)
          .maybeSingle();
        if (lookupError) throw lookupError;
        finalEmail = existingUser?.email;
        lastResend = existingUser?.last_resend_at;
      }

      // 60-second rate limit
      if (lastResend && (new Date().getTime() - new Date(lastResend).getTime() < 60000)) {
        throw new Error("Please wait 1 minute before requesting another email.");
      }

      const rawToken = crypto.randomUUID();
      const hashedToken = await hashToken(rawToken);
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30); 
      
      const payload: any = {
        user_id: finalUserId,
        email: finalEmail,
        token_expiry: expiry.toISOString(),
        updated_at: new Date().toISOString(),
        last_resend_at: new Date().toISOString()
      };

      if (action === "generate_verification") {
        payload.verification_token = hashedToken;
      } else {
        payload.reset_token = hashedToken;
      }

      const { error: upsertError } = await supabase
        .from('user_security')
        .upsert(payload, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      return new Response(JSON.stringify({ success: true, token: rawToken }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 400,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 400,
    });
  }
});

