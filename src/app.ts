import express from 'express';
import { Response, Request, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { rateLimitMiddleware } from './middlewares/ratelimit.middleware';
import logger from './utils/logger.js';
import globalErrorHandler from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';
import userRoute from './routes/user.route.js';
import todoRoute from './routes/todo.route.js';
import healthRouter from './routes/health.check.js';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';

dotenv.config();
const app = express();

app.use(rateLimitMiddleware);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(metricsMiddleware);

const morganFormat = ':method :url :status :response-time ms';

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(' ')[0],
          url: message.split(' ')[1],
          status: message.split(' ')[2],
          responseTime: message.split(' ')[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

app.use('/health', healthRouter);
app.use('/api/v1/auth', userRoute);
app.use('/api/v1', todoRoute);
app.all('/*splat', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Not Found`, 404));
});
app.use(globalErrorHandler);

export default app;
