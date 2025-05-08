import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import Sensor from '#models/sensor'
import SensorsHistory from '#models/sensors_history'
import axios from 'axios'
import Ws from './Ws.js'
import NotificationHistory from '#models/notification_history'

@inject()
export default class SensorService {
  constructor(
    private ctx: HttpContext,
  ) {}

  async pollSensors() {
    try{
    const {request, response} = this.ctx
    const sensors = await Sensor.all()
    var errorList:any = []

    console.log(Ws.io?.emit("poll", {data: "test"}))
    // console.log(Ws.io)

    await Promise.all(sensors.map(async item => {
      try{
        var results = await axios.get(`http://${item.hostname}`)
        if(results.status==200){
          let {s_temp, s_moisture,s_ec, PH, dht_temp, dht_hum} = results.data
          let sItem = await Sensor.find(item.id)
          let hasChanged = false;
          if(sItem){
            if(sItem.temperature != s_temp || sItem.temperature != s_temp || sItem.humidity != dht_hum || sItem.ph != PH) {
              hasChanged = true;
            }

            if(hasChanged){
              let sItemHistory = await new SensorsHistory()
              sItemHistory.lat = sItem.lat
              sItemHistory.lng = sItem.lng
              sItemHistory.sensorId = sItem.id
              sItemHistory.humidity = sItem.humidity
              sItemHistory.temperature = sItem.temperature
              sItemHistory.ph = sItem.ph
              await sItemHistory.save()
    
              sItem.temperature = s_temp
              sItem.humidity = dht_hum
              sItem.ph = PH

              await sItem.save()
              await this.interpretAndSaveNotification(sItemHistory)
            }
          }  
  
        }else{
          console.log(`Error on sensor ${item.name}`)
          errorList.push({name: item.name, error: results.data})
        }
      } catch (e){
        console.log(e.message)
        errorList.push({name: item.name, error: e.message})
      }

    }))

    var returnData = {
      errorList,
    }

    return response.status(200).json(returnData)
    } catch (e){
      return this.ctx.response.status(500).json(e)
    }
  }

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

  async getNotifications(){
    const {request, response} = this.ctx
    const {id} = request.body()

    let notifObject = await NotificationHistory.query().preload('sensorHistory')
    let countNotifs = await NotificationHistory.findManyBy("read", false)

    return response.status(200).json({notifications: notifObject, unreadCount: countNotifs?.length})
  }

  async resetNotifications() {
    const { response } = this.ctx
    const sensorHistories = await SensorsHistory.all()
  
    if (sensorHistories.length) {
      await Promise.all(sensorHistories.map(history => this.interpretAndSaveNotification(history)))
  
      return response.status(200).json({ success: true })
    }
  
    return response.status(400).json({ success: false, message: "No sensor history found." })
  }

  private async interpretAndSaveNotification(sensorHistory: SensorsHistory) {
    const temperature = Number.parseFloat(sensorHistory.temperature + "")
    const ph = Number.parseFloat(sensorHistory.ph + "")
    const humidity = Number.parseFloat(sensorHistory.humidity + "")
    
    const notifications: NotificationHistory[] = []
  
    // High humidity
    if (humidity > 50) {
      const notif = new NotificationHistory()
      notif.message = `High Humidity Detected (Reading: ${humidity}%)`
      notif.body = `
       Oh no! The humidity is too high; This could favor Fusarium pathogen activity.

      To manage this situation:
      - Increase field ventilation by pruning and spacing; MOnitor humidity to avoid prolonged wet conditions.
      `
      notif.sensorHistoryId = sensorHistory.id
      notif.read = false
      notif.updatedAt = sensorHistory.updatedAt
      notif.createdAt = sensorHistory.createdAt
      notifications.push(notif)
    }
  
    // Low humidity (example, <10%)
    if (humidity < 10) {
      const notif = new NotificationHistory()
      notif.message = `Low Humidity Detected (Reading: ${humidity}%)`
      notif.body = `
     Caution: Low humidity detected. Plants may experience water loss stress.

     To manage this situation:
     - improve field microclimate by adding windbreaks or irrigation misting.
      `
      notif.sensorHistoryId = sensorHistory.id
      notif.read = false
      notif.updatedAt = sensorHistory.updatedAt
      notif.createdAt = sensorHistory.createdAt
      notifications.push(notif)
    }
  
    // High temperature
    if (temperature > 28) {
      const notif = new NotificationHistory()
      notif.message = `High Temperature Detected (Reading: ${temperature}°C)`
      notif.body = `
      Oh no! The temperature is too high for  bana soil which could promote fusarium wilt!
  
      To manage this situation:
      - Apply mulch and install shade structures to reduce soil temperature. Monitor temperature daily.
      `

      notif.sensorHistoryId = sensorHistory.id
      notif.read = false
      notif.updatedAt = sensorHistory.updatedAt
      notif.createdAt = sensorHistory.createdAt
      notifications.push(notif)
    }
  
    // Low temperature
    if (temperature < 17) {
      const notif = new NotificationHistory()
      notif.message = `Low Temperature Detected (Reading: ${temperature}°C)`
      notif.body = `
      Warning! The soil temperature is too low; Banana growth my be stressed.

      To manage this situation:
      - Use mulch to retain warmth and reduce heat loss; Avoid planting in low-temperature seasons.
      `
      notif.sensorHistoryId = sensorHistory.id
      notif.read = false
      notif.updatedAt = sensorHistory.updatedAt
      notif.createdAt = sensorHistory.createdAt
      notifications.push(notif)
    }
  
    // High pH
    if (ph > 5.5) {
      const notif = new NotificationHistory()
      notif.message = `High pH Detected (Reading: ${ph})`
      notif.body = `
      Warning! Soil PH is too high; This may affect nutrient availability and disease dynamics.

      To manage this situation:
      - Add Acidifying agents or organic matter to lower soil PH gradually.
      `
      notif.sensorHistoryId = sensorHistory.id
      notif.read = false
      notif.updatedAt = sensorHistory.updatedAt
      notif.createdAt = sensorHistory.createdAt
      notifications.push(notif)
    }
  
    // Low pH
    if (ph < 2) {
      const notif = new NotificationHistory()
      notif.message = `Low pH Detected (Reading: ${ph})`
      notif.body = `
      Alert! Soil PH is too low; Acidic soils favor Fusarium wilt development.

      To manage this situation:
      - Apply lime to raise soil PH closer to neutral; Avoid ammonium based fertilizers.
      `
      notif.sensorHistoryId = sensorHistory.id
      notif.read = false
      notif.updatedAt = sensorHistory.updatedAt
      notif.createdAt = sensorHistory.createdAt
      notifications.push(notif)
    }
  
    // Save all generated notifications
    await Promise.all(notifications.map(notif => notif.save()))
  }


  async readNotification(){
    const {request, response} = this.ctx
    const {id} = request.params()

    let notifObject = await NotificationHistory.find(id)
    if(notifObject){
    notifObject.read = true;

    await notifObject?.save()

    return response.status(200).json({success:true})
    }else{
      return response.status(400).json({success:false, message: "notification object not found."})
    }
  }


}