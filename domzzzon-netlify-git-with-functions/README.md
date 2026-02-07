<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Отправка заявок в Telegram

Формы отправляют заявки в Telegram через Netlify Function `/.netlify/functions/telegram`.

На хостинге Netlify добавьте переменные окружения:

- `TELEGRAM_BOT_TOKEN` — токен вашего Telegram-бота
- `TELEGRAM_CHAT_ID` — куда отправлять заявки (числовой chat_id)

### Если нужно отправлять в личный аккаунт
1) Откройте чат с вашим ботом в Telegram и нажмите **Start** (или отправьте любое сообщение).
2) Узнайте свой `chat_id` одним из способов:
   - через @userinfobot (покажет ваш ID),
   - или откройте в браузере `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и возьмите `message.chat.id`.
3) Сохраните этот ID в Netlify как `TELEGRAM_CHAT_ID`.
