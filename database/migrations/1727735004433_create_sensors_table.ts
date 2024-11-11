import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sensors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable() // Name of the sensor
      table.decimal('lat', 10, 7).notNullable() // Latitude with precision
      table.decimal('lng', 10, 7).notNullable() // Longitude with precision
      table.float('temperature').nullable() // Temperature, float type for more precision
      table.float('humidity').nullable() // Humidity, float type
      table.float('ph').nullable() // pH level, float type
      table.text('metadata').nullable() // Additional metadata as text

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}