import net from 'net'
import { Aedes } from 'aedes'

export class MqttBrokerService {
  private aedes: Aedes | null = null
  private server: net.Server | null = null
  private readonly port = 1883

  public async start(): Promise<void> {
    this.aedes = await Aedes.createBroker()
    this.server = net.createServer(this.aedes.handle)

    this.aedes.on('clientReady', (client) => {
      console.log(`[Broker] Device connected: ${client.id}`)
    })
    this.aedes.on('clientDisconnect', (client) => {
      console.log(`[Broker] Device disconnected: ${client.id}`)
    })

    return new Promise((resolve, reject) => {
      this.server!.once('error', reject)
      this.server!.listen(this.port, '0.0.0.0', () => {
        console.log(`[Broker] Listening on TCP port ${this.port}`)
        this.server!.on('error', (err) => {
          console.error('[Broker] Server error:', err)
        })
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    if (this.server) await new Promise<void>((res) => this.server!.close(() => res()))
    if (this.aedes) await new Promise<void>((res) => this.aedes!.close(() => res()))
    this.server = null
    this.aedes = null
    console.log('[Broker] Stopped')
  }
}
