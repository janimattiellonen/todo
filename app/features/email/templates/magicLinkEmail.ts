import type { EmailMessage } from "~/features/email/emailMessage";

type Input = {
  to: string;
  from: string;
  magicLinkUrl: string;
};

/**
 * Magic-link sign-in email. Plain HTML string (no React-Email dep).
 * Inline styles only — many mail clients strip <style> blocks.
 */
export function magicLinkEmail(input: Input): EmailMessage {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sign in to Todo</title>
  </head>
  <body style="margin:0;padding:24px;background-color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:8px;padding:24px;">
      <tr>
        <td>
          <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:600;letter-spacing:-0.02em;line-height:1.2;">Sign in to Todo</h1>
          <p style="margin:0 0 20px 0;font-size:14px;line-height:1.5;color:#3f3f46;">
            Click the link below to sign in. It expires in 15 minutes and can only be used once.
          </p>
          <p style="margin:0 0 20px 0;">
            <a href="${input.magicLinkUrl}" style="display:inline-block;padding:10px 16px;background-color:#1f5862;color:#fafafa;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Sign in</a>
          </p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;">
            If you didn't request this, you can ignore this email — nothing will happen.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    from: input.from,
    to: input.to,
    subject: "Sign in to Todo",
    body: html,
  };
}
