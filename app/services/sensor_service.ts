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
      Your soil environment is experiencing high humidity levels which increases the risk of Fusarium wilt development.
  
      To manage this situation:
      - Improve drainage to prevent waterlogging
      - Increase ventilation in the area to reduce humidity
  
      Maintain balanced humidity to protect your plants!
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
      Your soil environment has very low humidity, which may stress plants.
  
      To manage this situation:
      - Increase watering frequency
      - Apply mulch to retain soil moisture
  
      Help your plants thrive by maintaining optimal humidity!
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
      Your soil temperature is currently above 28°C. This temperature supports Fusarium wilt development.
  
      To manage this situation:
      - Improve ventilation in the area
      - Apply mulching to stabilize soil conditions
      - Provide shade to reduce soil temperature
  
      Take action to prevent pathogen growth!
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
      Your soil temperature is currently below 17°C which inhibits Fusarium wilt but may impact plant health.
  
      To manage this situation:
      - Increase sunlight exposure when possible
      - Apply warm mulch to stabilize soil temperature
  
      Keep your soil within the optimal range for plant growth!
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
      Your soil pH is too high (above 5.5), which can limit nutrient availability and affect plant growth.
  
      To manage this situation:
      - Apply acidifiers to lower the soil pH
      - Regularly monitor pH levels
  
      Maintain an ideal pH range for healthy crops!
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
      Your soil pH is too low, which can cause nutrient deficiencies and impact plant health.
  
      To manage this situation:
      - Apply lime or compost to raise the soil pH
      - Regularly monitor pH levels
  
      Protect your crops by ensuring proper soil pH!
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
  

  // async resetNotifications() {
  //   const {request, response} = this.ctx
  //   let sensorHistory = await SensorsHistory.all()

  //   if(sensorHistory){
  //     await Promise.all(sensorHistory.map(async (item, index) => {
  //       let temperature = Number.parseFloat(item.temperature + "")
  //       let ph = Number.parseFloat(item.ph + "")
  //       let humidity = Number.parseFloat(item.humidity + "")
  //       let recordNotif = false;
  //       let notif = new NotificationHistory()
  //       notif.message = "";
  //       notif.body = "";

  //       if(humidity > 50){
  //         notif.message = ""
  //         notif.body = `
  //         Your soil nvironment is experiencing high humidity levels which increases the risk of Fusarium wilt development\n
  //         To manage this situation, here's what you should do:\n\n

  //         - Improve drainage to prevent waterlogging\n
  //         - Increase ventilation in the area to reduce humidity \n\n
  //         Maintain balanced humidity to protect your plants!
  //         `
  //       }
  //       if(humidity < 10){
  //         notif.message = ""
  //         notif.body = `
          
  //         `
  //       }
  //       if(temperature > 28 ){
  //         notif.message += `Temperature is above the 25'C (reading ${temperature}'C. ) Fusarium wilt may be in development. ` 
  //         notif.body = `
  //         Your soil temperature is currently above 28'C. This temperature range supports Fusarium wilt development.\n
  //         To maange this situation, here's what you should do:\n

  //         - Improve ventilation in the area.\n
  //         - Apply mulching to maintain stable soil conditions\n
  //         - Provide shade to reduce soil temperature further \n\n

  //         Take action to prevent pathogen growth!
  //         `
  //         recordNotif = true;
          
  //       }
  //       if(temperature < 17){
  //         notif.message += `Temperature is less than 17'C (reading ${temperature}'C. ) Plant health may be impacted.` 
  //         notif.body = 
  //         `Your soil temperature is currently below 17'C which inhibits Fusarium wilf development, but may impact plant health. 
  //         \n To manage this situation, here's what you should do:
  //         \n
  //         - Increase sunlight exposure when possible.\n 
  //         - Apply warm mulch to stabilize the soil temperature \n
  //         \n Keep your soil within the optimal range for plant growth!
  //         `
  //         recordNotif = true;
  //       }
  //       if (ph > 5.0) {
  //         recordNotif = true;
  //         notif.message += `PH levels are within 5.0 - 5.5 (reading ${ph}).` 
  //         notif.body = `
  //         Your soil PH is too high (5.0 - 5.5) which can limit nutrient availability and affect plant growth. \n
  //         To manage this situation, here's what you should do: \n
  //         \n
  //         - Apply acidifiers to lower the soil pH.\n
  //         - Regularly monitor the PH levels to maintain a balanced range.\n
  //         \n
  //         Keep the PH within the ideal range for healthy crops!
  //         `
  //       }
  //       if (ph < 2) {
  //         recordNotif = true;
  //         notif.message += `PH levels are too low. (reading ${ph}).` 
  //         notif.body = `
  //         Your soil PH is too low, whch can lead to nutrient deficiencies and impact plant health.\n
  //         To manage this situation, here's what you should do:\n
  //         \n
  //         - Apply lime or compost to increase soiul PH.\n
  //         - Regularly monitor PH levels to maintain balance\n\n
  //         Protect your crops by ensuring proper soil PH!
  //         `
  //       }
  //       if (humidity > 50){
  //         recordNotif = true;
  //         notif.message += `Relative Humidity is high. (reading ${humidity}% ) Fusarium wilt may be in development. ` 
  //       }

  //       if(recordNotif){
          
  //         notif.sensorHistoryId = item.id
  //         notif.read = false;
  //         notif.updatedAt = item.updatedAt;
  //         notif.createdAt = item.createdAt;
  //         await notif.save()
  //       }

  //       return true
  //     }))

  //     return response.status(200).json({success:true})

  //   }
  // }

  // //util 
  // async saveNotification(){

  // }

  // async interpretData(){

  // }

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