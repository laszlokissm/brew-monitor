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
  startTime: number
  endTime?: number | null
  notes?: string
  recipeSnapshot: Recipe
}

export interface BrewSessionState {
  sessionId: number
  name: string
  vesselId: string
  status: SessionStatus
  tempBottom: number | null
  tempTop: number | null
  timestamp: number
}

// ==========================================
// Telemetry & Hardware Ingestion
// ==========================================

export interface SensorReading {
  vesselId: string
  sensorId: string
  temperature: number
  timestamp: number
}

export interface TelemetryReading {
  id?: number
  sessionId: number
  timestamp: number
  tempBottom?: number
  tempTop?: number
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
