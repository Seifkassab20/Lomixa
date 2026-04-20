import { supabase, isSupabaseConfigured } from './supabase';

export interface EmailData {
  type: 'verification' | 'password_reset' | 'notification' | 'appointment';
  to: string;
  data: any;
}

export const emailService = {
  /**
   * Generates a token (verification or reset) and sends the email
   */
  async generateAndSendToken(
    action: 'generate_verification' | 'generate_reset',
    userId: string,
    email: string,
    userName: string
  ) {
    if (!isSupabaseConfigured) {
      console.log('Demo mode: Skipping token generation');
      return { success: true, token: 'demo-token' };
    }

    try {
      // 1. Generate Token in DB via Edge Function
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('auth-tokens', {
        body: { action, userId, email }
      });

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenError?.message || tokenData?.error || 'Failed to generate token');
      }

      const token = tokenData.token;

      // 2. Send Email via SendGrid Edge Function
      const baseUrl = window.location.origin;
      let emailType: EmailData['type'] = action === 'generate_verification' ? 'verification' : 'password_reset';
      
      const emailPayload: any = {
        name: userName,
      };

      if (action === 'generate_verification') {
        emailPayload.verifyLink = `${baseUrl}/verify-email?token=${token}`;
      } else {
        emailPayload.resetLink = `${baseUrl}/reset-password?token=${token}`;
      }

      const { data: sendData, error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          type: emailType,
          to: email,
          data: emailPayload
        }
      });

      if (sendError || !sendData?.success) {
        throw new Error(sendError?.message || sendData?.error || 'Failed to send email');
      }

      return { success: true };
    } catch (error) {
      console.error('Email Service Error:', error);
      throw error;
    }
  },

  /**
   * Verifies an email token
   */
  async verifyEmailToken(token: string) {
    if (!isSupabaseConfigured) return { success: true };
    const { data, error } = await supabase.functions.invoke('auth-tokens', {
      body: { action: 'verify_email', token }
    });
    if (error || !data?.success) throw new Error(error?.message || data?.error || 'Verification failed');
    return data;
  },

  /**
   * Resets password using token
   */
  async resetPassword(token: string, newPassword: string) {
    if (!isSupabaseConfigured) return { success: true };
    const { data, error } = await supabase.functions.invoke('auth-tokens', {
      body: { action: 'reset_password', token, newPassword }
    });
    if (error || !data?.success) throw new Error(error?.message || data?.error || 'Reset failed');
    return data;
  },

  /**
   * Sends a general notification email
   */
  async sendNotification(to: string, title: string, message: string, ctaLink?: string, ctaText?: string) {
    if (!isSupabaseConfigured) return;
    
    await supabase.functions.invoke('send-email', {
      body: {
        type: 'notification',
        to,
        data: { title, message, ctaLink, ctaText }
      }
    });
  },

  /**
   * Sends an appointment status email
   */
  async sendAppointmentEmail(to: string, status: string, date: string, time: string, appointmentType: string, link?: string) {
    if (!isSupabaseConfigured) return;
    
    await supabase.functions.invoke('send-email', {
      body: {
        type: 'appointment',
        to,
        data: { status, date, time, appointmentType, link }
      }
    });
  },

  /**
   * Resends verification email
   */
  async resendVerification(userId: string, email: string, name: string) {
    return this.generateAndSendToken('generate_verification', userId, email, name);
  }
};

