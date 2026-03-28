const MAILPIT_URL = 'http://localhost:54324';

export async function clearMailpit(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}

export async function getOTP(): Promise<string> {
  // Poll until a new email arrives
  let messages = [];
  while (messages.length === 0) {
    await new Promise(r => setTimeout(r, 500));
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = await res.json();
    messages = data.messages;
  }

  const msgRes = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
  const msgData = await msgRes.json();

  const otp = msgData.Text.match(/\d{6}/)?.[0];
  if (!otp) throw new Error('OTP not found in email');
  return otp;
}
