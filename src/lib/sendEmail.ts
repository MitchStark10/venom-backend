import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

if (
  !process.env.SMTP_PASSWORD ||
  !process.env.SMTP_ACCOUNT ||
  !process.env.EMAIL_FROM
) {
  console.error(
    "SMTP_ACCOUNT, SMTP_PASSWORD, or EMAIL_FROM environment variable not set"
  );
  process.exit(1);
}

const SMTP_ACCOUNT = process.env.SMTP_ACCOUNT;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM;

const transportOptions = {
  host: "mail.smtp2go.com",
  port: 2525,
  auth: {
    user: SMTP_ACCOUNT,
    pass: SMTP_PASSWORD,
  },
};

export const sendEmail = async ({ to, subject, html }: Mail.Options) => {
  try {
    const mailTransport = nodemailer.createTransport(transportOptions);

    await mailTransport.sendMail({
      from: EMAIL_FROM,
      to,
      replyTo: SMTP_ACCOUNT,
      subject,
      html,
    });
  } catch (err) {
    console.error(`send365Email: An error occurred:`, err);
    throw err;
  }
};
