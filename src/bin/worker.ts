import 'dotenv/config';
import { jobQueueClient, loggerWorker, redisClient } from '../lib'
import { AppDataSource, initializeDatabase } from '../db';
import { initError } from '../server/errors/error';
import { setupTasks } from '../tasks';

async function startWorker() {
	console.log('Starting worker...');

	try {
		// Improve the error class
		initError();

		// Connect to the database
		await initializeDatabase();

		// Initialize Redis
		await redisClient.initialize();

		// Connect to the job queue
		await jobQueueClient.initialize();

		// Initialize the jobs
		const { jobs, crons, longRunningJobs } = await setupTasks();

		// Periodically unlock the jobs that are stuck for more than 5 minutes or 1 hour if they are long running
		setInterval(async () => {
			try {
				if (!longRunningJobs.length) {
					loggerWorker.info('No long running jobs found.');
				} else {
					const longRunningJobsSQL = longRunningJobs.map((job) => `'${job}'`).join(', ');

					await AppDataSource.transaction(async (transactionManager) => {
						const [stuckQueues, affected1] = await transactionManager.query(
							`UPDATE graphile_worker.jobs SET locked_at = NULL, locked_by = NULL WHERE (queue_name IN (${longRunningJobsSQL}) AND EXTRACT(EPOCH FROM (current_timestamp - locked_at)) >= 1 * 60 * 60) OR (queue_name NOT IN (${longRunningJobsSQL}) AND EXTRACT(EPOCH FROM (current_timestamp - locked_at)) >= 5 * 60) RETURNING task_identifier, payload;`,
						);
						if (affected1 > 0) {
							const [, affected2] = await transactionManager.query(
								`UPDATE graphile_worker.job_queues SET locked_at = NULL, locked_by = NULL WHERE (queue_name IN (${longRunningJobsSQL}) AND EXTRACT(EPOCH FROM (current_timestamp - locked_at)) >= 1 * 60 * 60) OR (queue_name NOT IN (${longRunningJobsSQL}) AND EXTRACT(EPOCH FROM (current_timestamp - locked_at)) >= 5 * 60);`,
							);

							if (affected1 !== affected2) {
								throw new Error(
									`Found mismatched entries in "jobs" (${affected1}) and "job_queues" (${affected2}).`,
								);
							}

							loggerWorker.warn(
								`Successfully unlocked ${affected1} stuck jobs from ${affected2} queues.`,
								{
									stuckQueues,
								},
							);
						}
					});
				}
			} catch (error) {
				console.error(error);

				loggerWorker.error('Could not unlock stuck jobs.', { error });
			}
		}, 1 * 60 * 1000); // Every minute

		await jobQueueClient.runJobsAndSetupCrons(jobs, crons);

		// Setup the signal handlers
		process.on('unhandledRejection', (error, promise) => {
			loggerWorker.error('Unhandled promise rejection.', { error, promise });
		});

		process.on('uncaughtException', (err) => {
			loggerWorker.error('Uncaught exception.', { err });
		});

		process.once('SIGINT', () => {
			loggerWorker.warn('Received SIGINT, shutting down...');
			loggerWorker.flush();
			process.exit(0);
		});

		process.once('SIGTERM', () => {
			loggerWorker.warn('Received SIGTERM, shutting down...');
			loggerWorker.flush();
			process.exit(0);
		});

		loggerWorker.info('Successfully initialized worker.');
	} catch (error) {
		loggerWorker.error('Failed to start the worker.', { error });
		throw error;
	}
}

startWorker();
