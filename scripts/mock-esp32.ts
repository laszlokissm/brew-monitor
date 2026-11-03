import mqtt from 'mqtt'

// ==========================================
// Mock Hardware Configuration
// ==========================================
const BROKER_URL = 'mqtt://127.0.0.1:1883'
const VESSEL_ID = 'kettle-1'
const PUBLISH_INTERVAL_MS = 2000 // Send reading every 2 seconds

// Simulation state: kettle bottom vs kettle top
let tempBottom = 22.0
let tempTop = 21.5
const targetTemperature = 65.0

console.log(`[Mock ESP32] Connecting to broker at ${BROKER_URL}...`)

const client = mqtt.connect(BROKER_URL, {
  clientId: `esp32-mock-${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  reconnectPeriod: 2000
})

client.on('connect', () => {
  console.log('[Mock ESP32] Connected to MQTT broker!')
  console.log(
    `[Mock ESP32] Publishing to temp/1 (bottom) and temp/2 (top) every ${PUBLISH_INTERVAL_MS / 1000}s`
  )
  console.log('[Mock ESP32] Press Ctrl+C to stop.\n')

  setInterval(() => {
    simulateTemperatures()
    publishReadings()
  }, PUBLISH_INTERVAL_MS)
})

client.on('error', (err) => {
  console.error('[Mock ESP32] Connection error:', err.message)
})

client.on('close', () => {
  console.log('[Mock ESP32] Disconnected from broker')
})

function simulateTemperatures(): void {
  if (tempBottom < targetTemperature) {
    // Bottom warms up faster near the heat element
    tempBottom = Math.min(targetTemperature, tempBottom + (0.8 + Math.random() * 0.4))
    // Top lags slightly behind due to convection
    tempTop = Math.min(targetTemperature, tempTop + (0.6 + Math.random() * 0.4))
  } else {
    // Fluctuate around target
    const noiseBottom = (Math.random() - 0.5) * 0.4
    const noiseTop = (Math.random() - 0.5) * 0.5
    tempBottom = targetTemperature + noiseBottom
    tempTop = targetTemperature - 0.4 + noiseTop
  }
}

function publishReadings(): void {
  const now = Date.now()
  const b = tempBottom.toFixed(2)
  const t = tempTop.toFixed(2)

  // CSV payload format: "vesselId,temperature,timestamp"
  const payload1 = `${VESSEL_ID},${b},${now}`
  const payload2 = `${VESSEL_ID},${t},${now}`

  client.publish('temp/1', payload1)
  client.publish('temp/2', payload2)

  console.log(`[Mock ESP32] Published -> Bottom (temp/1): ${b}°C | Top (temp/2): ${t}°C`)
}

process.on('SIGINT', () => {
  console.log('\n[Mock ESP32] Stopping simulation...')
  client.end(false, () => {
    process.exit(0)
  })
})
