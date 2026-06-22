import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendContestReminderEmail = async (to: string, contestName: string, startTime: Date) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP credentials not provided. Skipping email reminder.");
    return;
  }

  const mailOptions = {
    from: `"CodeBuddy AI" <${process.env.SMTP_USER}>`,
    to,
    subject: `Contest Reminder: ${contestName} starts in 1 Hour!`,
    text: `Hi there!\n\nJust a quick reminder that "${contestName}" is starting at ${startTime.toLocaleString()}.\n\nGood luck!`,
    html: `<p>Hi there!</p><p>Just a quick reminder that <strong>${contestName}</strong> is starting at ${startTime.toLocaleString()}.</p><p>Good luck!</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email reminder sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};
