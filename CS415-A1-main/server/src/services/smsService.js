const { URLSearchParams } = require('url');

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || '').trim();
}

async function sendViaTwilio({ to, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error('Twilio is not fully configured');
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const payload = new URLSearchParams({ To: to, From: from, Body: message });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Twilio SMS request failed');
  }

  return {
    provider: 'twilio',
    providerMessageId: data?.sid || null,
    status: data?.status || 'queued',
  };
}

async function sendSms({ to, message }) {
  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo) {
    throw new Error('Recipient phone number is required');
  }

  const provider = String(process.env.SMS_PROVIDER || 'twilio').toLowerCase();

  if (provider === 'twilio') {
    return sendViaTwilio({ to: normalizedTo, message: String(message || '') });
  }

  console.log(`[SMS:mock] to=${normalizedTo} message=${String(message || '')}`);
  return {
    provider: 'mock',
    providerMessageId: null,
    status: 'simulated',
  };
}

module.exports = {
  sendSms,
};
