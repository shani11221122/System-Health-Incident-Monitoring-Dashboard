const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendAlertEmail(monitorName, url, type) {
  try {
    let subject, message;

    if (type === 'DOWN') {
      subject = `🔴 ${monitorName} is DOWN`;
      message = `${monitorName} (${url}) is not responding.`;
    } else if (type === 'RECOVERED') {
      subject = `🟢 ${monitorName} has RECOVERED`;
      message = `${monitorName} (${url}) is back online.`;
    } else if (type === 'CREATED') {
      subject = `🆕 New monitor created: ${monitorName}`;
      message = `${monitorName} (${url}) has been added to monitoring.`;
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.ALERT_EMAIL_TO,
      subject,
      html: `<p>${message}</p><p>Time: ${new Date().toLocaleString()}</p>`,
    });

    if (error) {
      console.error('Resend rejected the email:', error.message);
      return;
    }

    console.log(`Alert email sent: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}


module.exports = { sendAlertEmail };