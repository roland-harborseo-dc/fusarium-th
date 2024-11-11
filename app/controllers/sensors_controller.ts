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
}