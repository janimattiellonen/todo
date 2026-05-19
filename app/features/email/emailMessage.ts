/**
 * A single outbound email.
 *
 * `to` is **a single email address, not an array**. This is the type-level
 * defence against the cross-tenant leakage risk: one outbound send → one
 * recipient. If you need to send to multiple users, make multiple calls.
 */
export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  body: string;
};
