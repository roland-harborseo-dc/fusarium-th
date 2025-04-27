import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import SensorsHistory from './sensors_history.js'

export default class NotificationHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

    @column()
    declare sensorHistoryId: number

    @belongsTo(() => SensorsHistory)
    declare sensorHistory: BelongsTo<typeof SensorsHistory>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare read: Boolean

  @column()
  declare message: String

}