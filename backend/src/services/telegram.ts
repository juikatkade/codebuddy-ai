import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User';

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: true });

  // Listen for /start to register chat_id
  bot.onText(/\/start (.+)?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramUsername = msg.from?.username;

    if (telegramUsername) {
      try {
        const user = await User.findOne({ telegramUsername });
        if (user) {
          user.telegramChatId = chatId.toString();
          await user.save();
          bot?.sendMessage(chatId, "Awesome! You are connected. I will remind you of upcoming contests.");
        } else {
          bot?.sendMessage(chatId, "I couldn't find your username in the CodeBuddy AI system. Make sure you set it in the extension first!");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      bot?.sendMessage(chatId, "Please set a Telegram username in your Telegram app settings first, then click start again.");
    }
  });
} else {
  console.warn("TELEGRAM_BOT_TOKEN not provided. Telegram bot not started.");
}

export const sendContestReminderTelegram = async (chatId: string, contestName: string, startTime: Date) => {
  if (!bot) return;

  const message = `🚀 *Contest Reminder*\n\n*${contestName}* is starting in 1 hour!\n\nTime: ${startTime.toLocaleString()}\n\nGood luck!`;
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`Telegram reminder sent to chat ${chatId}`);
  } catch (error) {
    console.error(`Failed to send telegram to ${chatId}:`, error);
  }
};
