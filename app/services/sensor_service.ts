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

              let temperature = Number.parseFloat(s_temp + "")
              let ph = Number.parseFloat(PH + "")
              let humidity = Number.parseFloat(dht_hum + "")
              let recordNotif = false;
              let notif = new NotificationHistory()
              notif.message = "";
                //@ts-ignore
                notif.sensorHistory = item.id
      
              if(temperature > 25 && temperature < 30){
                recordNotif = true;
                notif.message += `Temperature is higher than 25'C/30'C (reading ${temperature}'C. ) Fusarium wilt may be in development. ` 
              }
              if (ph > 3.5 && ph < 7) {
                recordNotif = true;
                notif.message += `PH levels are within 3.5 ~ 7 (reading ${ph}) Fusarium wilt may be in development. ` 
              }
              if (humidity > 50){
                recordNotif = true;
                notif.message += `Relative Humidity is high. (reading ${humidity}% ) Fusarium wilt may be in development. ` 
              }
      
              if(recordNotif){
                await notif.save()
              }
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

    let notifObject = await NotificationHistory.all()

    return response.status(200).json(notifObject)
  }

  async resetNotifications() {
    const {request, response} = this.ctx
    let sensorHistory = await SensorsHistory.all()

    if(sensorHistory){
      await Promise.all(sensorHistory.map(async (item, index) => {
        let temperature = Number.parseFloat(item.temperature + "")
        let ph = Number.parseFloat(item.ph + "")
        let humidity = Number.parseFloat(item.humidity + "")
        let recordNotif = false;
        let notif = new NotificationHistory()
        notif.message = "";
          

        if(temperature > 25 && temperature < 30){
          recordNotif = true;
          notif.message += `Temperature is higher than 25'C/30'C (reading ${temperature}'C. ) Fusarium wilt may be in development. ` 
        }
        if (ph > 3.5 && ph < 7) {
          recordNotif = true;
          notif.message += `PH levels are within 3.5 ~ 7 (reading ${ph}) Fusarium wilt may be in development. ` 
        }
        if (humidity > 50){
          recordNotif = true;
          notif.message += `Relative Humidity is high. (reading ${humidity}% ) Fusarium wilt may be in development. ` 
        }

        if(recordNotif){
          
          notif.sensorHistoryId = item.id
          notif.read = false;
          await notif.save()
        }

        return true
      }))

      return response.status(200).json({success:true})

    }
  }

  async readNotification(){
    const {request, response} = this.ctx
    const {id} = request.body()

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