import { supabase, isSupabaseConfigured } from './supabase';

export interface EmailData {
  type: 'verification' | 'password_reset' | 'notification' | 'appointment';
  to: string;
  data: any;
}

export const emailService = {
  /**
   * Generates a token (verification or reset) and sends the email
   * (Now handled natively by Supabase Auth)
   */
  async generateAndSendToken(
    action: 'generate_verification' | 'generate_reset',
    userId: string,
    email: string,
    userName: string
  ) {
    console.log(`[EmailService] ${action} is now handled natively by Supabase Auth.`);
    return { success: true };
  },

  /**
   * Verifies an email token
   * (Now handled natively by Supabase Auth PKCE flow)
   */
  async verifyEmailToken(token: string) {
    console.log(`[EmailService] verifyEmailToken is now handled natively by Supabase Auth.`);
    return { success: true };
  },

  /**
   * Resets password using token
   * (Now handled natively by Supabase Auth)
   */
  async resetPassword(token: string, newPassword: string) {
    console.log(`[EmailService] resetPassword is now handled natively by Supabase Auth.`);
    return { success: true };
  },

  /**
   * Sends a general notification email
   * (SendGrid removed as per requirements)
   */
  async sendNotification(to: string, title: string, message: string, ctaLink?: string, ctaText?: string) {
    console.log(`[EmailService] Mock sending notification to ${to}: ${title}`);
  },

  /**
   * Sends an appointment status email
   * (SendGrid removed as per requirements)
   */
  async sendAppointmentEmail(to: string, status: string, date: string, time: string, appointmentType: string, link?: string) {
    console.log(`[EmailService] Mock sending appointment to ${to}: ${status}`);
  },

  /**
   * Resends verification email
   */
  async resendVerification(userId: string, email: string, name: string) {
    if (!isSupabaseConfigured) return;
    return supabase.auth.resend({
      type: 'signup',
      email,
    });
  }
};
