import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Sensor from './sensor.js'

export default class SensorsHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @belongsTo(()=> Sensor)
  declare sensor: BelongsTo<typeof Sensor>

  @column()
  declare lat: Number

  @column()
  declare lng: Number

  @column()
  declare temperature: Number

  @column()
  declare humidity: number

  @column()
  declare ph: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}