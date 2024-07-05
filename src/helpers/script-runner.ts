import { initializeDatabase } from '../db';

export const ScriptRunner = async (fn: () => Promise<void>) => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ScriptRunner is only available in development mode');
  }

  console.log('Initializing database');
  console.time('ScriptRunner');

  await initializeDatabase();

  console.log('Running handler function');

  await fn();

  console.timeEnd('ScriptRunner');
  console.log('Done');
  process.exit(0);
};
