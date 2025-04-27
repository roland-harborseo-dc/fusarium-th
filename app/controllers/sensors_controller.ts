import { inject } from '@adonisjs/core'
import SensorService from '#services/sensor_service'

@inject()
export default class SensorsController {
    constructor(private sensorService:SensorService){}

    async getSensor (){
        return this.sensorService.getSensor()
    }

    async createSensor(){
        return this.sensorService.createSensor()
    }

    async pollSensors(){
        return this.sensorService.pollSensors()
    }

    async getNotifications(){
        return this.sensorService.getNotifications()
    }

    async resetNotifications(){
        return this.sensorService.resetNotifications()
    }

    async readNotification(){
        return this.sensorService.readNotification()
    }
}