import { NextFunction, Request, Response } from 'express';
import { UtmData } from '../../types/utm';

export const mixpanelMiddleware = (req: Request, _: Response, next: NextFunction) => {
  const utm: Partial<UtmData> = {};

  if (req.headers['x-utm-source']) {
    utm.utm_source = req.headers['x-utm-source'] as string;
  }

  if (req.headers['x-utm-medium']) {
    utm.utm_medium = req.headers['x-utm-medium'] as string;
  }

  if (req.headers['x-utm-campaign']) {
    utm.utm_campaign = req.headers['x-utm-campaign'] as string;
  }

  if (req.headers['x-utm-term']) {
    utm.utm_term = req.headers['x-utm-term'] as string;
  }

  if (req.headers['x-utm-content']) {
    utm.utm_content = req.headers['x-utm-content'] as string;
  }

  req.utm = utm;

  next();
};
