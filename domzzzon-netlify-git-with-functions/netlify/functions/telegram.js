export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        body: 'Missing TELEGRAM_BOT_TOKEN env var',
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const message = String(body.message || '').trim();
    if (!message) {
      return { statusCode: 400, body: 'Empty message' };
    }

    // Куда отправлять заявки:
    // - для личного аккаунта Telegram нужен числовой chat_id (ваш user id)
    // - для группы/канала обычно id отрицательный (например -100xxxxxxxxxx)
    // Username вида @name для личного аккаунта НЕ подходит.
    const chat_id = process.env.TELEGRAM_CHAT_ID;
    if (!chat_id) {
      return {
        statusCode: 500,
        body: 'Missing TELEGRAM_CHAT_ID env var (numeric). For personal account: start the bot and set your user id as TELEGRAM_CHAT_ID.',
      };
    }

    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: message,
        disable_web_page_preview: true,
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return { statusCode: resp.status, body: text };
    }

    return { statusCode: 200, body: text };
  } catch (err) {
    return { statusCode: 500, body: String(err?.message || err) };
  }
};
