import { isSupabaseConfigured, supabase } from './supabase';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Service to send real-time emails. 
 * Note: For production security, this should always be triggered via a 
 * Supabase Edge Function to protect API keys.
 */
export async function sendEmail({ to, subject, html }: EmailOptions, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || import.meta.env.VITE_RESEND_API_KEY;

  // Direct Resend API Call (High Priority for testing)
  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: 'Lomixa <onboarding@resend.dev>',
          to: [to],
          subject,
          html
        })
      });
      const data = await response.json();
      return { ...data, mode: 'live' };
    } catch (err) {
      console.error('Direct Resend API call failed:', err);
    }
  }

  // If Supabase is configured, we attempt to call an Edge Function 'send-email'
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html }
      });
      if (error) throw error;
      return { ...data, mode: 'edge' };
    } catch (err) {
      console.warn('Supabase Edge Function email failed, falling back to log:', err);
    }
  }

  // Fallback / Demo Mode: Log to console
  console.log('--- EMAIL SENT (DEMO MODE) ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--- Content Start ---');
  console.log(html.replace(/<[^>]*>?/gm, ' ')); // Stripping HTML for console readability
  console.log('--- Content End ---');
  return { success: true, mode: 'demo' };
}

/**
 * Standardized Email Templates
 */
export const EmailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to LOMIXA!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h1 style="color: #10b981;">Welcome to LOMIXA, ${name}!</h1>
        <p>Your professional healthcare connection has been established.</p>
        <p>You can now start managing visits, digital schedules, and professional collaborations across the MENA region.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">This is an automated notification from the LOMIXA Platform.</p>
      </div>
    `
  }),
  
  bookingRequest: (doctorName: string, repName: string, date: string, time: string, type: string) => ({
    subject: `New Visit Requested - ${date}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #10b981;">New Visit Request</h2>
        <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
        <p>A sales representative, <strong>${repName}</strong>, has requested a <strong>${type}</strong> visit with you.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;"><strong>Method:</strong> ${type}</p>
        </div>
        <p>Please log in to your LOMIXA dashboard to confirm or reschedule this request.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #666;">LOMIXA Connect - Digital Healthcare Infrastructure</p>
      </div>
    `
  }),

  bundleRequest: (pharmaName: string, bundleName: string, amount: string) => ({
    subject: 'New Bundle Purchase Request',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #10b981;">New Acquisition Review</h2>
        <p>An enterprise partner has submitted a bundle request for approval.</p>
        <p><strong>Company:</strong> ${pharmaName}</p>
        <p><strong>Package:</strong> ${bundleName}</p>
        <p><strong>Value:</strong> ${amount}</p>
        <p>Please review and approve this transaction in the Admin Dashboard to grant access.</p>
      </div>
    `
  })
};
