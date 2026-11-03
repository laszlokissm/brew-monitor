import { EventEmitter } from 'events'
import { MqttSubscriberService } from './MqttSubscriberService'
import { BrewSession } from './BrewSession'
import { Recipe, SensorReading, BrewSessionState } from './types'

export class SessionManager extends EventEmitter {
  private activeSessions = new Map<string, BrewSession>()
  private nextSessionId = 1

  constructor(mqttSubscriber: MqttSubscriberService) {
    super()

    mqttSubscriber.on('reading', (reading: SensorReading) => {
      this.routeReading(reading)
    })
  }

  public startSession(name: string, vesselId: string, recipe: Recipe): BrewSession {
    if (this.activeSessions.has(vesselId)) {
      throw new Error(`Vessel "${vesselId}" already has an active brew session`)
    }

    const sessionId = this.nextSessionId++
    const session = new BrewSession(sessionId, name, vesselId, recipe)

    session.on('stateUpdate', (state: BrewSessionState) => {
      this.emit('sessionStateUpdate', state)
    })

    this.activeSessions.set(vesselId, session)
    return session
  }

  public stopSession(vesselId: string): void {
    const session = this.activeSessions.get(vesselId)
    if (!session) {
      return
    }

    session.status = 'completed'
    this.activeSessions.delete(vesselId)
  }

  public routeReading(reading: SensorReading): void {
    const session = this.activeSessions.get(reading.vesselId)
    if (session && session.status === 'active') {
      session.feedReading(reading)
    }
  }
}
