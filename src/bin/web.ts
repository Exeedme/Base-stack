import 'dotenv/config';
import http from 'http';
import { jobQueueClient, logger, redisClient } from '../lib';
import { initializeDatabase } from '../db';
import { initError } from '../server/errors/error';
import { env } from '../config/env';
import { setupApp } from '../server';

async function startWeb() {
	try {
		// Improve the error class
		initError();

		// Connect to the database
		await initializeDatabase();

		// Initialize Redis
		await redisClient.initialize();

		// Connect to the job queue
		await jobQueueClient.initialize();

		// Start the server
		const app = setupApp();


		const server = http.createServer(app);

		process.on('unhandledRejection', (error, promise) => {
			logger.error('Unhandled promise rejection.', { error, promise });
		});

		process.on('uncaughtException', (err) => {
			logger.error('Uncaught exception.', { err });
		});

		process.once('SIGINT', () => {
			logger.warn('Received SIGINT, shutting down...');

			server.close((err) => {
				if (err) {
					logger.error('Failed to close the server.', { err });
				}

				logger.flush();
				process.exit(0);
			});
		});

		process.once('SIGTERM', () => {
			logger.warn('Received SIGTERM, shutting down...');

			server.close((err) => {
				if (err) {
					logger.error('Failed to close the server.', { err });
				}

				logger.flush();
				process.exit(0);
			});
		});

		server.on('error', (error) => {
			logger.error('Error when starting the server.', { error });
			logger.flush();
			process.exit(1);
		});

		server.on('listening', () => {
			logger.info(`Successfully initialized web server on port ${env.PORT}!`);
		});

		server.listen(env.PORT);
	} catch (error) {
		logger.error('Failed to start the server.', { error });
		throw error;
	}
}

startWeb();
