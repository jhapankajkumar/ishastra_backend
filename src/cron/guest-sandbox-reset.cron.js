/**
 * 🕒 NIGHTLY GUEST SANDBOX RESET CRON
 *
 * Wipes the shared guest sandbox back to a curated demo dataset every
 * night, bounding any spam/abuse from anonymous writes to at most 24
 * hours. Same class shape as WatchlistCron (constructor/start/triggerNow).
 */

const cron = require('node-cron');
const { reseedGuestSandbox } = require('../seed/guest-sandbox-seed');

class GuestSandboxResetCron {
  start() {
    // Runs daily at 5:00 AM Singapore time — well outside market hours.
    cron.schedule(
      '0 5 * * *',
      async () => {
        console.log('⏰ NIGHTLY GUEST SANDBOX RESET TRIGGERED - 5:00 AM SGT');
        try {
          const result = await reseedGuestSandbox();
          console.log('✅ GUEST SANDBOX RESET COMPLETED:', result);
        } catch (error) {
          console.error('❌ GUEST SANDBOX RESET FAILED:', error);
        }
      },
      {
        timezone: 'Asia/Singapore',
        scheduled: true,
      }
    );

    console.log('🕒 Guest sandbox reset cron job scheduled for 5:00 AM SGT (daily)');
  }

  async triggerNow() {
    console.log('🔧 MANUAL TRIGGER - Resetting guest sandbox now...');
    return await reseedGuestSandbox();
  }
}

module.exports = GuestSandboxResetCron;
