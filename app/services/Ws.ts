import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
class Ws {
  io: Server | undefined
  private booted = false

  boot() {
    /**
     * Ignore multiple calls to the boot method
     */
    console.log("ws server")
    if (this.booted) {
      console.log("WS Started")
      return
    }

    this.booted = true
    this.io = new Server(server.getNodeServer(), {
      cors: {
        origin: '*',
      },
    })
  }
}

export default new Ws()