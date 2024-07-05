import express, { Application, NextFunction, Request, Response } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { v4 as uuid } from 'uuid';

import anonymizer from '../helpers/anonymizer';
import expressMiddleware from './middleware/express';
import { mixpanelMiddleware } from './middleware/mixpanel';
import { env } from '../config/env';
import getRouteHandlers from './routes';
import { logger } from '../lib/logger';

export const setupApp = (): Application => {
	const app = express();

	// Add the request/response helpers
	app.use(expressMiddleware);

	// // Try to set the correct IP address
	// app.use((req, _res, next) => {
	// 	req.userIp = (req.headers['ggcase-forwarded-for']) ? req.headers['ggcase-forwarded-for'] : req.ip;
	// 	next();
	// });

	// add requestId to the request
	app.use((req, _res, next) => {
		req.requestId = uuid();
		next();
	});

	// Enable CORS
	app.use(
		cors({
			origin: ['http://localhost:3000'],
			credentials: true,
			maxAge: 3600,
		}),
	);

	// Enable Helmet to provide some extra security
	app.use(helmet());

	// Enable compression
	app.use(compression());

	// Add the response helpers
	app.use(cookieParser(env.COOKIE_SECRET));

	app.use(mixpanelMiddleware);

	// Enable logging to keep track of what is happening
	app.use((req, res, next) => {
		morgan(':method :url :status | :total-time ms | :date[clf]', {
			stream: {
				write: (str) => {
					const userSignature = req._user ? req._user.id : 'ANONYMOUS';
					logger.info(
						`${userSignature} | ${req.requestId} | ${str.slice(0, str.length - 1)}  | ${req.userIp
						}\n`,
						{
							body: Object.keys(req.body).length !== 0 ? anonymizer(req.body) : undefined,
							error: res._error,
							userId: req._user?.id,
						},
					);
				},
			},
		})(req, res, next);
	});

	// Enable JSON parser to put JSON payloads in req.body
	app.use(express.json());

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
		res.respondWithError('Invalid JSON body.', 400);
	});

	// Set the route handlers
	app.use('/', getRouteHandlers());

	// Catch not found routes
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	app.use((_req, res, _next) => {
		res.respondWithError('Not Found', 404);
	});

	// Catch unhandled errors
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
		res.respondWithError('Internal Server Error', 500, err);
	});

	app.set('trust proxy', true);

	// hydrate app with data

	return app;
};
