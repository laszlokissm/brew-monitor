import { EventEmitter } from 'events'
import mqtt, { MqttClient } from 'mqtt'
import { SensorReading } from './types'

export class MqttSubscriberService extends EventEmitter {
  private client: MqttClient | null = null

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.client = mqtt.connect('mqtt://127.0.0.1:1883')

      this.client.on('connect', () => {
        this.client!.subscribe('temp/+')
        console.log('[Subscriber] Connected and subscribed to temp/+')
        resolve()
      })

      this.client.on('message', (topic, payload) => {
        const reading = this.parsePayload(topic, payload.toString())
        if (reading) {
          this.emit('reading', reading)
        }
      })

      this.client.on('error', (err) => {
        console.error('[Subscriber] Client error:', err.message)
      })
    })
  }

  public async stop(): Promise<void> {
    if (this.client) {
      await new Promise<void>((resolve) => this.client!.end(false, {}, () => resolve()))
      console.log('[Subscriber] Stopped')
    }
  }

  private parsePayload(topic: string, text: string): SensorReading | null {
    const topicParts = topic.split('/')
    if (topicParts.length !== 2 || topicParts[0] !== 'temp') return null
    const sensorId = topicParts[1]

    const parts = text.split(',').map((s) => s.trim())
    if (parts.length !== 3) return null

    const [vesselId, tempStr, timeStr] = parts
    const temperature = parseFloat(tempStr)
    const timestamp = parseInt(timeStr, 10)

    if (isNaN(temperature) || isNaN(timestamp) || !vesselId) return null

    return { vesselId, sensorId, temperature, timestamp }
  }
}
