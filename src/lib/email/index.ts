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

export async function sendPaymentFailedEmail(
  email: string,
  fullName: string,
  hostedInvoiceUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const updatePaymentLink = hostedInvoiceUrl
      ? `<p><a href="${hostedInvoiceUrl}" style="display:inline-block;padding:12px 24px;background-color:#e74c3c;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Update Payment Method</a></p>`
      : `<p>Please log in to your account and update your payment method in billing settings.</p>`;

    await resend.emails.send({
      from: 'EnhancedHR <noreply@enhancedhr.ai>',
      to: email,
      subject: 'Action Required: Payment Failed - EnhancedHR',
      html: `
        <h2>Hello ${fullName},</h2>
        <p>We were unable to process your most recent payment for your EnhancedHR subscription.</p>
        <p>You have a <strong>7-day grace period</strong> to update your payment method before your access is affected.</p>
        ${updatePaymentLink}
        <p>If you need assistance, please contact us at <a href="mailto:support@enhancedhr.ai">support@enhancedhr.ai</a>.</p>
        <br>
        <p>- The EnhancedHR Team</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendPaymentActionRequiredEmail(
  email: string,
  fullName: string,
  hostedInvoiceUrl?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const completePaymentLink = hostedInvoiceUrl
      ? `<p><a href="${hostedInvoiceUrl}" style="display:inline-block;padding:12px 24px;background-color:#3498db;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Complete Payment Verification</a></p>`
      : `<p>Please log in to your account and complete the payment verification in billing settings.</p>`;

    await resend.emails.send({
      from: 'EnhancedHR <noreply@enhancedhr.ai>',
      to: email,
      subject: 'Action Required: Complete Your Payment - EnhancedHR',
      html: `
        <h2>Hello ${fullName},</h2>
        <p>Your bank requires additional verification to complete your EnhancedHR subscription payment.</p>
        <p>Please complete the verification within <strong>24 hours</strong> to avoid any interruption to your service.</p>
        ${completePaymentLink}
        <p>If you need assistance, please contact us at <a href="mailto:support@enhancedhr.ai">support@enhancedhr.ai</a>.</p>
        <br>
        <p>- The EnhancedHR Team</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send payment action required email:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendSubscriptionCanceledEmail(
  email: string,
  fullName: string,
  endDate?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessLine = endDate
      ? `<p>You will continue to have access to EnhancedHR until <strong>${endDate}</strong>.</p>`
      : '';

    await resend.emails.send({
      from: 'EnhancedHR <noreply@enhancedhr.ai>',
      to: email,
      subject: 'Subscription Canceled - EnhancedHR',
      html: `
        <h2>Hello ${fullName},</h2>
        <p>Your EnhancedHR subscription has been canceled.</p>
        ${accessLine}
        <p>If you change your mind, you can resubscribe at any time from your <strong>billing settings</strong>.</p>
        <p>If you need assistance, please contact us at <a href="mailto:support@enhancedhr.ai">support@enhancedhr.ai</a>.</p>
        <br>
        <p>- The EnhancedHR Team</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send subscription canceled email:', error);
    return { success: false, error: String(error) };
  }
}
