import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import aiRoutes from "./routes/aiRoutes.js";
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import studentAuthRoutes from './routes/studentAuthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import postRoutes from './routes/postRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import pool from './config/database.js';
import { patchEventsTable } from "./config/patchEventsTable.js";
import { initPostsDatabase } from './config/initPostsDatabase.js';
import { initStudentsDatabase } from './config/initStudentsDatabase.js';
import { initConnectionsDatabase } from './config/initConnectionsDatabase.js';
import { initDonationsDatabase } from './config/initDonationsDatabase.js';
import { initLocationsDatabase } from './config/initLocationsDatabase.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true,
    exposedHeaders: ['Content-Disposition'], // Allow frontend to read Content-Disposition header
  })
);

// Webhook route MUST come before express.json() to receive raw body
app.use('/api/donations/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SETU API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      studentAuth: '/api/auth/student',
      admin: '/api/admin',
      events: '/api/events',
      jobs: '/api/jobs',
      posts: '/api/posts',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/student', studentAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api", aiRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/locations', locationRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// ---- Start server after DB patch ----
const startServer = async () => {
  try {
    await patchEventsTable();
    await initPostsDatabase();
    await initStudentsDatabase();
    await initDonationsDatabase();
    await initConnectionsDatabase();
    await initLocationsDatabase();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   🚀 SETU Server Running               ║
║   📡 Port: ${PORT}                     
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}       
║   🔗 URL: http://localhost:${PORT}     
╚════════════════════════════════════════╝
      `);
    });

  } catch {
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', () => {
  process.exit(1);
});

export default app;
