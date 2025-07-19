/**
 * Spectre AI Assistant - Main Entry Point
 * Initializes the system and starts the web server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './core/config';
import { spectreLogger } from './core/logger';
import { orchestrator } from './core/orchestrator';
import { agents } from './agents';

/**
 * Main application class
 */
class SpectreApp {
  private app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.getValue('corsOrigin'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, _res, next) => {
      spectreLogger.success('web', 'request_received', undefined, undefined,
        `${req.method} ${req.path}`, 'processing_request',
        { method: req.method, path: req.path, ip: req.ip, userAgent: req.get('User-Agent') });
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      const health = orchestrator.getSystemHealth();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        ...health,
      });
    });

    // API routes
    this.app.use('/api/v1', this.setupApiRoutes());
    
    // Web interface routes
    this.app.use('/api/v1/chat', this.setupWebRoutes().chat);
    this.app.use('/api/v1/logs', this.setupWebRoutes().logs);
    this.app.use('/api/v1/dashboard', this.setupWebRoutes().dashboard);

    // Static files (for web UI)
    this.app.use('/static', express.static('src/web/ui/static'));

    // Default route
    this.app.get('/', (_req, res) => {
      res.json({
        name: 'Spectre AI Assistant',
        version: '1.0.0',
        description: 'Your Virtual CTO, Developer, and Planner',
        endpoints: {
          health: '/health',
          api: '/api/v1',
          docs: '/api/v1/docs',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });

    // Error handler
    this.app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      spectreLogger.failure('web', 'request_error', error.message, undefined, req.path,
        'Request error occurred', 'error_handled', { method: req.method, path: req.path, error: error.message });

      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: config.getValue('debugMode') ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Setup API routes
   */
  private setupApiRoutes(): express.Router {
    const router = express.Router();

    // Projects endpoints
    router.get('/projects', (_req, res) => {
      try {
        const projects = orchestrator.getAllProjects();
        res.json({
          success: true,
          data: projects,
          count: projects.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.post('/projects', (req, res) => {
      try {
        const { name, type, description } = req.body;
        
        if (!name || !type) {
          return res.status(400).json({
            success: false,
            error: 'Name and type are required',
          });
        }

        return orchestrator.createProject(name, type, description)
          .then(project => {
            return res.status(201).json({
              success: true,
              data: project,
            });
          })
          .catch(error => {
            return res.status(500).json({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.get('/projects/:id', (req, res) => {
      try {
        const project = orchestrator.getProject(req.params.id);
        if (!project) {
          return res.status(404).json({
            success: false,
            error: 'Project not found',
          });
        }

        return res.json({
          success: true,
          data: project,
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.post('/projects/:id/start', (req, res) => {
      try {
        orchestrator.startProject(req.params.id)
          .then(() => {
            res.json({
              success: true,
              message: 'Project started successfully',
            });
          })
          .catch(error => {
            res.status(500).json({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.post('/projects/:id/stop', (req, res) => {
      try {
        orchestrator.stopProject(req.params.id)
          .then(() => {
            res.json({
              success: true,
              message: 'Project stopped successfully',
            });
          })
          .catch(error => {
            res.status(500).json({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.post('/projects/:id/plan', (req, res) => {
      try {
        orchestrator.generateExecutionPlan(req.params.id)
          .then(plan => {
            res.json({
              success: true,
              data: plan,
            });
          })
          .catch(error => {
            res.status(500).json({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.post('/projects/:id/execute', (req, res) => {
      try {
        orchestrator.executeProjectPlan(req.params.id)
          .then(() => {
            res.json({
              success: true,
              message: 'Project execution started',
            });
          })
          .catch(error => {
            res.status(500).json({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.get('/projects/:id/logs', (req, res) => {
      try {
        const limit = parseInt((req.query as any)['limit'] as string) || 50;
        const logs = orchestrator.getProjectLogs(req.params.id, limit);
        
        res.json({
          success: true,
          data: logs,
          count: logs.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // System endpoints
    router.get('/system/health', (_req, res) => {
      try {
        const health = orchestrator.getSystemHealth();
        res.json({
          success: true,
          data: health,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.get('/system/agents', (_req, res) => {
      try {
        const agents = orchestrator.getAllAgents();
        res.json({
          success: true,
          data: agents,
          count: agents.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    return router;
  }

  /**
   * Setup web interface routes
   */
  private setupWebRoutes() {
    const chatRoutes = require('./web/routes/chat').default;
    const logsRoutes = require('./web/routes/logs').default;
    const dashboardRoutes = require('./web/routes/dashboard').default;

    return {
      chat: chatRoutes,
      logs: logsRoutes,
      dashboard: dashboardRoutes
    };
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    const port = config.getValue('port');

    try {
      this.server = this.app.listen(port, () => {
        spectreLogger.success('web', 'server_started', undefined, undefined,
          `Spectre AI Assistant server started on port ${port}`, 'ready_for_requests',
          { port, environment: config.getValue('nodeEnv') });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      spectreLogger.failure('web', 'server_start_failed', 
        error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * Shutdown the server
   */
  public async shutdown(): Promise<void> {
    spectreLogger.success('web', 'shutdown_started', undefined, undefined,
      'Shutting down Spectre AI Assistant server', 'cleanup_in_progress');

    try {
      // Shutdown orchestrator
      await orchestrator.shutdown();

      // Close server
      if (this.server) {
        this.server.close(() => {
          spectreLogger.success('web', 'shutdown_completed', undefined, undefined,
            'Spectre AI Assistant server shutdown completed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    } catch (error) {
      spectreLogger.failure('web', 'shutdown_error', 
        error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

/**
 * Start the application
 */
async function main(): Promise<void> {
  try {
    // Initialize configuration
    config.validate();
    
    // Register all agents with the orchestrator
    spectreLogger.success('main', 'registering_agents', undefined, undefined,
      'Registering agents with orchestrator');
    
    orchestrator.registerAgent(agents.questioner);
    orchestrator.registerAgent(agents.planner);
    orchestrator.registerAgent(agents.executor);
    orchestrator.registerAgent(agents.reviewer);
    orchestrator.registerAgent(agents.validator);
    
    spectreLogger.success('main', 'agents_registered', undefined, undefined,
      'All agents registered successfully', 'system_ready');
    
    // Create and start the application
    const app = new SpectreApp();
    await app.start();

  } catch (error) {
    console.error('Failed to start Spectre AI Assistant:', error);
    process.exit(1);
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  main();
}

export default SpectreApp;