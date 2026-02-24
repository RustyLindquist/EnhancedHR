'use server';

import { createClient } from '@/lib/supabase/server';
import { sendContactEmail } from '@/lib/email';

export async function submitContactForm(formData: {
  subject: string;
  message: string;
  email: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userName: string | undefined;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      userName = profile?.full_name || user.email || undefined;
    }

    const result = await sendContactEmail({
      subject: formData.subject,
      message: formData.message,
      email: formData.email,
      phone: formData.phone,
      userName,
    });

    return result;
  } catch (error) {
    console.error('Failed to submit contact form:', error);
    return { success: false, error: 'Failed to send message. Please try again.' };
  }
}
