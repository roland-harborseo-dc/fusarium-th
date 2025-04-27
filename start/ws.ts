import app from '@adonisjs/core/services/app'
import Ws from '#services/Ws'
app.ready(() => {
  console.log('[WS] Starting Websocket server')
  Ws.boot()
  const io = Ws.io
  io?.on('connection', (socket) => {
    console.log(socket.id)
    socket.on('test', socket=> {
      console.log('event')
      console.log(socket)
    })
  })
})