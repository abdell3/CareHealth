const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailHost = process.env.EMAIL_HOST;
  const emailPort = Number(process.env.EMAIL_PORT || 587);
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailHost || !emailUser || !emailPass) {
    throw new Error("Email configuration is incomplete. EMAIL_HOST, EMAIL_USER, and EMAIL_PASS are required.");
  }

  transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  return mailer.sendMail(mailOptions);
}

module.exports = {
  sendEmail,
  getTransporter,
};

