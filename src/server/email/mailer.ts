import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

import { env, isSecureSmtp } from '@/config/env.mjs';

export type SendMailInput = {
  to: string;
  subject: string;
  react: ReactElement;
};

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: isSecureSmtp,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export async function sendTransactionalEmail({ to, subject, react }: SendMailInput) {
  const html = render(react);

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}
