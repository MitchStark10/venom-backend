import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

if (!process.env.EMAIL_PASSWORD || !process.env.EMAIL_ACCOUNT) {
  console.error("EMAIL_ACCOUNT or EMAIL_PASSWORD environment variable not set");
  process.exit(1);
}

const EMAIL_ACCOUNT = process.env.EMAIL_ACCOUNT;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const transportOptions = {
  host: "mail.smtp2go.com",
  port: 2525,
  auth: {
    user: EMAIL_ACCOUNT,
    pass: EMAIL_PASSWORD,
  },
};

export const send365Email = async ({ to, subject, html }: Mail.Options) => {
  try {
    const mailTransport = nodemailer.createTransport(transportOptions);

    await mailTransport.sendMail({
      from: EMAIL_ACCOUNT,
      to,
      replyTo: EMAIL_ACCOUNT,
      subject,
      html,
    });
  } catch (err) {
    console.error(`send365Email: An error occurred:`, err);
    throw err;
  }
};
