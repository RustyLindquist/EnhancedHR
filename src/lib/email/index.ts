import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTemporaryPasswordEmail(
  email: string,
  tempPassword: string,
  fullName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'EnhancedHR <noreply@enhancedhr.ai>',
      to: email,
      subject: 'Your Temporary Password - EnhancedHR',
      html: `
        <h2>Hello ${fullName},</h2>
        <p>Your password has been reset by an administrator.</p>
        <p>Your temporary password is: <strong>${tempPassword}</strong></p>
        <p>Please log in and change your password immediately.</p>
        <br>
        <p>- The EnhancedHR Team</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send password email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendContactEmail({
  subject,
  message,
  email,
  phone,
  userName,
}: {
  subject: string;
  message: string;
  email: string;
  phone?: string;
  userName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const contactDetails = [
      `<p><strong>From:</strong> ${userName || 'Unknown user'} (${email})</p>`,
      phone ? `<p><strong>Phone:</strong> ${phone}</p>` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await resend.emails.send({
      from: 'EnhancedHR <noreply@enhancedhr.ai>',
      to: 'support@enhancedhr.ai',
      replyTo: email,
      subject: `[Contact Form] ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        ${contactDetails}
        <hr />
        <h3>Subject: ${subject}</h3>
        <p>${message}</p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return { success: false, error: String(error) };
  }
}
