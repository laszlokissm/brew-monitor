import express, { Express } from 'express'
import cors from 'cors'
import { Server } from 'http'
import { RecipeService } from './RecipeService'
import { createRecipeRouter } from './routes/recipeRoutes'

export interface ServerServices {
  recipeService: RecipeService
}

export class HttpServer {
  private app: Express
  private server: Server | null = null
  private port: number

  constructor(services: ServerServices, port = 3001) {
    this.port = port
    this.app = express()

    this.configureMiddleware()
    this.configureRoutes(services)
  }

  private configureMiddleware(): void {
    // Allow cross-origin requests from the React frontend dev server
    this.app.use(cors())
    // Parse incoming JSON request bodies
    this.app.use(express.json())
  }

  private configureRoutes(services: ServerServices): void {
    // Health check endpoint
    this.app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() })
    })

    // Mount recipe routes
    this.app.use('/api/recipes', createRecipeRouter(services.recipeService))
  }

  /**
   * Starts listening on the configured HTTP port
   */
  public start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`[HttpServer] Express REST API listening on http://localhost:${this.port}`)
        resolve(this.port)
      })

      this.server.on('error', (err) => {
        reject(err)
      })
    })
  }

  /**
   * Stops the HTTP server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[HttpServer] Server stopped')
          this.server = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Exposes the Express app instance for testing or mounting WebSockets
   */
  public getApp(): Express {
    return this.app
  }

  public getHttpServer(): Server | null {
    return this.server
  }
}
