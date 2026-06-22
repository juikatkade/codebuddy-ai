import cron from 'node-cron';
import axios from 'axios';
import User from '../models/User';
import { sendContestReminderEmail } from './email';
import { sendContestReminderTelegram } from './telegram';

interface Contest {
  id: string;
  name: string;
  start: string;
}

// Check every 30 minutes
export const startScheduler = () => {
  console.log("Starting contest scheduler...");

  cron.schedule('*/30 * * * *', async () => {
    try {
      const upcomingContests = await fetchUpcomingContests();

      const now = new Date();
      
      const contestsToRemind = upcomingContests.filter(c => {
        const startTime = new Date(c.start);
        const diffMs = startTime.getTime() - now.getTime();
        const diffMins = diffMs / (1000 * 60);
        return diffMins > 45 && diffMins <= 75; // Roughly 1 hour away
      });

      if (contestsToRemind.length === 0) return;

      const users = await User.find({ "preferences.contestRemindersEnabled": true });

      for (const contest of contestsToRemind) {
        const startTime = new Date(contest.start);
        for (const user of users) {
          if (user.email) {
            await sendContestReminderEmail(user.email, contest.name, startTime);
          }
          if (user.telegramChatId) {
            await sendContestReminderTelegram(user.telegramChatId, contest.name, startTime);
          }
        }
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });
};

const fetchUpcomingContests = async (): Promise<Contest[]> => {
  // Try Clist API if provided, otherwise return empty
  const CLIST_API_KEY = process.env.CLIST_API_KEY;
  const CLIST_USER = process.env.CLIST_USER;
  
  if (CLIST_API_KEY && CLIST_USER) {
    try {
      const now = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const url = `https://clist.by/api/v4/contest/?username=${CLIST_USER}&api_key=${CLIST_API_KEY}&start__gte=${now}&start__lte=${nextWeek}`;
      const response = await axios.get(url);
      
      return response.data.objects.map((c: any) => ({
        id: c.id.toString(),
        name: c.event,
        start: c.start
      }));
    } catch (e) {
      console.error("Clist API error", e);
      return [];
    }
  }

  return [];
};
