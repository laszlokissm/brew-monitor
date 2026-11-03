import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseService } from './DatabaseService'
import { RecipeService } from './RecipeService'
import { HttpServer } from './server'
import { MqttBrokerService } from './MqttBrokerService'
import { MqttSubscriberService } from './MqttSubscriberService'
import { SessionManager } from './SessionManager'

let databaseService: DatabaseService | null = null
let httpServer: HttpServer | null = null
let mqttBroker: MqttBrokerService | null = null
let mqttSubscriber: MqttSubscriberService | null = null
let sessionManager: SessionManager | null = null

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Backend Services
  try {
    console.log('[Main] Initializing DatabaseService...')
    databaseService = new DatabaseService()
    const recipeService = new RecipeService(databaseService)

    console.log('[Main] Starting MQTT Broker on port 1883...')
    mqttBroker = new MqttBrokerService()
    await mqttBroker.start()

    console.log('[Main] Starting MQTT Subscriber...')
    mqttSubscriber = new MqttSubscriberService()
    await mqttSubscriber.start()

    mqttSubscriber.on('reading', (reading) => {
      console.log('[Main] Ingested sensor reading:', reading)
    })

    console.log('[Main] Initializing SessionManager...')
    sessionManager = new SessionManager(mqttSubscriber)

    sessionManager.on('sessionStateUpdate', (state) => {
      console.log('[Main] Session state update:', state)
    })

    console.log('[Main] Starting HTTP Server on port 3001...')
    httpServer = new HttpServer({ recipeService }, 3001)
    await httpServer.start()

    console.log('[Main] All backend services initialized successfully.')
  } catch (error) {
    console.error('[Main] Failed to initialize backend services:', error)
  }

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Clean shutdown on app quit
app.on('before-quit', async () => {
  if (httpServer) {
    await httpServer.stop()
  }
  if (mqttSubscriber) {
    await mqttSubscriber.stop()
  }
  if (mqttBroker) {
    await mqttBroker.stop()
  }
  if (databaseService) {
    databaseService.close()
  }
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
