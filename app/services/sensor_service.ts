import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Sensor from '#models/sensor'
import SensorsHistory from '#models/sensors_history'

@inject()
export default class SensorService {
  constructor(
    private ctx: HttpContext,
  ) {}

  async getSensor() {
    const {request, response} = this.ctx
    let { id } = request.params()
    console.log("Sensor service - get all")
    
    id ? console.log("id specified") : console.log("id not specified")
    console.log(id)

    if(id){
        const sensorData = await Sensor.findBy('id', id)
        if(!sensorData){
            return response.status(400).json({message:"Sensor not found"})
        }

        let history = await SensorsHistory.findManyBy('sensor_id', id)?? []

        let returnBody = sensorData.toJSON();
        returnBody.history = history

        return response.status(200).json(returnBody)
    }
    else{
        const sensors = await Sensor.all()

        return response.status(200).json(sensors)
    }
  }

  async createSensor(){
    const {request, response} = this.ctx
    const { name, lat, lng, metadata } = request.body()

    let sensorObject = await new Sensor()
    sensorObject.name = name
    sensorObject.lat = lat
    sensorObject.lng = lng
    sensorObject.metadata = metadata
    await sensorObject.save()

    let returnBody = {
        status: "OK",
        data: sensorObject
    }

    return response.status(200).json(returnBody)
  }
}