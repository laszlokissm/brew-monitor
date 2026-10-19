// ==========================================
// Recipe Models
// ==========================================

export interface RecipeStep {
  id?: number
  recipeId?: number
  stepOrder: number
  name: string
  targetTemperature: number // in °C
  durationMinutes: number
}

export interface Recipe {
  id: number
  name: string
  description?: string
  steps: RecipeStep[]
}

// ==========================================
// Session Models
// ==========================================

export type SessionStatus = 'active' | 'completed' | 'aborted'

export interface SessionRecord {
  id: number
  name: string
  recipeId?: number
  vesselId: string
  status: SessionStatus
  startTime: number // Unix timestamp
  endTime?: number | null
  notes?: string
  recipeSnapshot: Recipe // Full snapshot of recipe (metadata and steps) at session start
}

// ==========================================
// Telemetry & Hardware Ingestion
// ==========================================

export interface MqttReading {
  vesselId: string
  temperature: number
  timestamp: number
}

export interface TelemetryReading {
  id?: number
  sessionId: number
  timestamp: number
  temperature: number
  targetTemperature?: number
}

// ==========================================
// Notifications & Events
// ==========================================

export type NotificationLevel = 'info' | 'warning' | 'error'

export interface SessionNotification {
  id?: number
  sessionId: number
  timestamp: number
  level: NotificationLevel
  message: string
}

// ==========================================
// Real-Time Live Streaming (WebSocket)
// ==========================================

export interface LiveSessionState {
  sessionId: number
  vesselId: string
  status: SessionStatus
  currentTemperature: number
  targetTemperature: number
  currentStepIndex: number
  currentStepName: string
  stepRemainingSeconds: number
  timestamp: number
}
