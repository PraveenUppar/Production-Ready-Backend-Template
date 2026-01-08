import express from 'express';
import { Response, Request, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import globalErrorHandler from './middlewares/error.middleware.js';
import AppError from './utils/AppError.js';
import userRoute from './routes/user.route.js';
import todoRoute from './routes/todo.route.js';
import { prisma } from './libs/prisma.js';
import redis from './redis/redis.js';

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(limiter);

const morganFormat = ':method :url :status :response-time ms';

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        // Use the 'info' level of our custom logger
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

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis connection
    await redis.ping();

    res.status(200).json({
      status: 'active',
      uptime: process.uptime(),
      db: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'Inactive',
      error: 'Service unavailable',
    });
  }
});

app.use('/api/v1/auth', userRoute);
app.use('/api/v1', todoRoute);
app.all('/*splat', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Not Found`, 404));
});
app.use(globalErrorHandler);

export default app;
