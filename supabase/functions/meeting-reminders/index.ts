import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // 1. Get appointments that start in exactly the next 15-20 mins
    const now = new Date();
    const futureLimit = new Date(now.getTime() + 20 * 60000); // 20 mins from now
    const futureStart = new Date(now.getTime() + 14 * 60000); // 14 mins from now

    // We query both doctors and sales_reps joined or we can just fetch all and find emails locally if we don't have joins properly mapped
    // Note: This relies on appointments table having doctor and rep data, or we fetch them manually.
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .gte('start_time', futureStart.toISOString())
      .lte('start_time', futureLimit.toISOString())
      .eq('status', 'accepted');

    if (apptError) throw apptError;

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No upcoming appointments." }), { status: 200 });
    }

    // 2. Fetch User Emails for these appointments
    // Since reps and doctors have user_id, we can look up their emails via supabase auth admin or from user_security/profiles if available.
    // For simplicity, assuming user_security has emails.
    const userIds = appointments.flatMap((a: any) => [a.doctor_user_id, a.rep_user_id]);
    
    const { data: userSecurities } = await supabase
      .from('user_security')
      .select('user_id, email')
      .in('user_id', userIds);

    const emailMap = (userSecurities || []).reduce((acc: any, curr: any) => {
      acc[curr.user_id] = curr.email;
      return acc;
    }, {});

    let sentCount = 0;

    // 3. Dispatch Emails
    for (const appt of appointments) {
      const doctorEmail = emailMap[appt.doctor_user_id];
      const repEmail = emailMap[appt.rep_user_id];

      const timeString = new Date(appt.start_time).toLocaleTimeString();

      const reminderPayload = {
        title: "Meeting Reminder",
        message: `You have an upcoming appointment scheduled to start at ${timeString}. Please join the meeting on time.`
      };

      // Notify Doctor
      if (doctorEmail) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ type: 'notification', to: doctorEmail, data: reminderPayload })
        });
        sentCount++;
      }

      // Notify Rep
      if (repEmail) {
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ type: 'notification', to: repEmail, data: reminderPayload })
        });
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
