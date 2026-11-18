const API = 'http://localhost:3000/api'

const post = async (path, body, token) => {
  const response = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  })
  return { status: response.status, data: await response.json().catch(() => null) }
}

const getJson = async (path, token) => {
  const response = await fetch(API + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return { status: response.status, data: await response.json().catch(() => null) }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(`FALLO: ${message}`)
  console.log(`ok - ${message}`)
}

const email = `checkout-${Date.now()}@test.local`
assert((await post('/auth/register', { fullName: 'Prueba Checkout', email, phone: '3001234567', password: 'secreto123' })).status === 201, 'registro')
const login = await post('/auth/login', { email, password: 'secreto123' })
assert(login.status === 200 && !!login.data.token, 'login devuelve token')
const token = login.data.token

const movies = await getJson('/movies')
const functions = await getJson(`/movies/${movies.data[0].id}/functions`)
assert(functions.status === 200 && functions.data.length > 0, 'hay funciones futuras')
const functionId = functions.data[0].id

const seats = await getJson(`/functions/${functionId}/seats`)
const picked = seats.data.filter((seat) => seat.status === 'AVAILABLE').slice(0, 2)
assert(picked.length === 2, 'hay asientos disponibles')

for (const seat of picked) {
  const lock = await post('/seatLocks', { seatId: seat.id, functionId }, token)
  assert(lock.status === 201, `bloqueo del asiento ${seat.id}`)
}

const seatsWithLock = await getJson(`/functions/${functionId}/seats`)
assert(
  picked.every((seat) => seatsWithLock.data.find((item) => item.id === seat.id)?.status === 'LOCKED'),
  'el mapa marca los asientos como LOCKED',
)

const checkout = await post('/checkout', { seats: picked.map((seat) => ({ functionId, seatId: seat.id })) }, token)
assert(checkout.status === 201 && checkout.data.status === 'PENDING', 'checkout crea orden PENDING')
assert(Number(checkout.data.total) === Number(functions.data[0].basePrice) * 2, 'total calculado en servidor (2 x basePrice)')

const payment = await post('/payments', { orderId: checkout.data.id, method: 'CARD' }, token)
assert(payment.status === 201 && payment.data.status === 'PENDING', 'pago nace PENDING')
const retry = await post('/payments', { orderId: checkout.data.id, method: 'CARD' }, token)
assert(retry.status === 200 && retry.data.id === payment.data.id, 'el pago es idempotente')

const tickets = await post(`/orders/${checkout.data.id}/tickets`, {}, token)
assert(tickets.status === 201 && tickets.data.length === 2, 'se emiten 2 tickets')
assert(tickets.data.every((ticket) => ticket.status === 'PENDING' && ticket.qrCode.length > 10), 'tickets PENDING con QR')
const again = await post(`/orders/${checkout.data.id}/tickets`, {}, token)
assert(again.status === 201 && again.data.length === 2, 'la emision es idempotente')

const after = await getJson(`/functions/${functionId}/seats`)
assert(
  picked.every((seat) => after.data.find((item) => item.id === seat.id)?.status === 'OCCUPIED'),
  'los asientos quedan OCCUPIED y sin bloqueo',
)

const noLock = await post('/checkout', { seats: [{ functionId, seatId: picked[0].id }] }, token)
assert(noLock.status === 409, 'checkout sin bloqueo responde 409')

const list = await getJson(`/tickets?orderId=${checkout.data.id}`, token)
assert(list.status === 200 && list.data.length === 2, 'el dueño consulta sus tickets')

const other = await post('/auth/register', { fullName: 'Otro Usuario', email: `otro-${Date.now()}@test.local`, phone: '3001234567', password: 'secreto123' })
const otherLogin = await post('/auth/login', { email: other.data.user.email, password: 'secreto123' })
const foreign = await getJson(`/tickets?orderId=${checkout.data.id}`, otherLogin.data.token)
assert(foreign.status === 404, 'otro usuario no puede leer los tickets (404)')

console.log('\nE2E checkout: OK')
