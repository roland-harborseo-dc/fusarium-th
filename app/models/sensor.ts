import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Sensor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

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

  @column()
  declare metadata: string

  @column()
  declare hostname: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}