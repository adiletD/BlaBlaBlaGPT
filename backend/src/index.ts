import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import promptRoutes from './routes/prompts';
import providerRoutes from './routes/providers';
import questionRoutes from './routes/questions';
import config from './config';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Prompt Refinement API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
app.use('/api/prompts', promptRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/questions', questionRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`🔗 CORS origin: ${config.corsOrigin}`);
  
  // Log available providers
  const availableProviders = Object.entries(config.llmProviders)
    .filter(([, provider]) => provider)
    .map(([name]) => name);
  
  console.log(`🤖 Available LLM providers: ${availableProviders.join(', ')}`);
});

export default app; 