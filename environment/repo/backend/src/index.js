const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes');
const seedDatabase = require('./seed');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse incoming request payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in production-style format
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/api', routes);

// Serve Frontend static assets in Production
const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// Fallback all routes to index.html for SPA (Vue Router history mode)
app.get('*', (req, res, next) => {
  // If it's an API request, let it go (will return 404 naturally if not matched above)
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      // In development, the front-end might not be built yet, so give a friendly message.
      res.status(200).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; margin:0;">
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center;">
              <h2 style="color: #4f46e5; margin-bottom: 0.5rem;">VibeFile Cloud Backend</h2>
              <p style="color: #4b5563;">Backend service is running on port ${PORT}.</p>
              <p style="color: #9ca3af; font-size: 0.875rem;">Frontend is not yet built. Run <code>npm run build</code> in frontend to compile UI.</p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

// Initialize DB Seeding & start server
async function startServer() {
  try {
    await seedDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=========================================`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
