import { EventEmitter } from 'events'
import { Recipe, SessionStatus, SensorReading, BrewSessionState } from './types'

export class BrewSession extends EventEmitter {
  public readonly id: number
  public readonly name: string
  public readonly vesselId: string
  public readonly recipe: Recipe

  public status: SessionStatus = 'active'
  public tempBottom: number | null = null
  public tempTop: number | null = null

  constructor(id: number, name: string, vesselId: string, recipe: Recipe) {
    super()
    this.id = id
    this.name = name
    this.vesselId = vesselId
    this.recipe = recipe
  }

  public feedReading(reading: SensorReading): void {
    if (reading.sensorId === '1') {
      this.tempBottom = reading.temperature
    } else if (reading.sensorId === '2') {
      this.tempTop = reading.temperature
    }

    this.emit('stateUpdate', this.getState())
  }

  public getState(): BrewSessionState {
    return {
      sessionId: this.id,
      name: this.name,
      vesselId: this.vesselId,
      status: this.status,
      tempBottom: this.tempBottom,
      tempTop: this.tempTop,
      timestamp: Date.now()
    }
  }
}
