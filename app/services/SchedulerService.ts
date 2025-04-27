import schedule from 'node-schedule'
import SensorsController from '../controllers/sensors_controller.js'
import { inject } from '@adonisjs/core'
import axios from 'axios'
@inject()

export default class SchedulerService {
  public static scheduleJobs() {
    console.log("Sched!")
    // Example: Run every minute
    schedule.scheduleJob('*/10 * * * * *', async () => {
      console.log('Polling Sensors')
        //should be rewrritten cause this is fked up
      var results = await axios.post(`http://${process.env.HOST}:${process.env.PORT}/pollSensors`)
      console.log("[Sensors]:", results.data)
    })
  }
}