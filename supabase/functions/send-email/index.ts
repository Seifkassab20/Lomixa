import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6"

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")

// Types for requests
interface EmailRequest {
  type: string; // 'verification' | 'password_reset' | 'notification' | 'appointment_confirmation'
  to: string;
  data: any; 
}

// Generate Templates depending on `type`
function generateEmail(type: string, data: any) {
  let subject = "";
  let html = "";

  switch (type) {
    case "verification":
      subject = "Verify your Email - Lomixa";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6366f1;">Welcome to Lomixa!</h2>
          <p>Hello ${data.name || 'User'},</p>
          <p>Thank you for registering. Please click the button below to verify your email address and activate your account.</p>
          <a href="${data.verifyLink}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">If you didn't request this, please ignore this email.</p>
        </div>
      `;
      break;

    case "password_reset":
      subject = "Password Reset Request - Lomixa";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6366f1;">Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to choose a new password.</p>
          <a href="${data.resetLink}" style="display: inline-block; background-color: #f43f5e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">This link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `;
      break;

    case "notification":
      subject = data.subject || "Notification from Lomixa";
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6366f1;">${data.title || "Notification"}</h2>
          <p>Hello ${data.name || 'User'},</p>
          <p>${data.message}</p>
          ${data.ctaLink ? `<a href="${data.ctaLink}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${data.ctaText || "View Detail"}</a>` : ""}
        </div>
      `;
      break;

    case "appointment":
      subject = `Appointment Status: ${data.status} - Lomixa`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #6366f1;">Appointment ${data.status}</h2>
          <p>Your appointment on <strong>${data.date}</strong> at <strong>${data.time}</strong> has been ${data.status.toLowerCase()}.</p>
          <p><strong>Type:</strong> ${data.appointmentType}</p>
          ${data.link ? `<a href="${data.link}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Details</a>` : ""}
        </div>
      `;
      break;
      
    default:
      subject = "Message from Lomixa";
      html = `<p>${JSON.stringify(data)}</p>`;
  }

  return { subject, html };
}

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    if (!SENDGRID_API_KEY) {
      throw new Error("Missing SendGrid API Key");
    }

    const { type, to, data } = await req.json() as EmailRequest;
    
    if (!type || !to || !data) {
      throw new Error("Missing required fields: type, to, data");
    }

    const { subject, html } = generateEmail(type, data);

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "noreply@lomixa.com", name: "Lomixa" }, // Use your verified sender
        subject: subject,
        content: [{ type: "text/html", value: html }]
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("SendGrid API Error:", errorText);
      throw new Error("Failed to send email");
    }

    // Return success
    return new Response(JSON.stringify({ success: true, message: "Email Sent Successfully" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 400,
    })
  }
})
