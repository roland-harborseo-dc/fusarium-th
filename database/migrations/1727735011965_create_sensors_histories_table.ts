import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sensors_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
      .integer('sensor_id') // Foreign key referencing the sensor
      .unsigned()
      .references('id')
      .inTable('sensors')
      .onDelete('CASCADE') // Deletes history entries if a sensor is deleted
      .notNullable()

    table.decimal('lat', 10, 7).notNullable() // Latitude with precision
    table.decimal('lng', 10, 7).notNullable() // Longitude with precision
    table.float('temperature').nullable() // Temperature, float type for more precision
    table.float('humidity').nullable() // Humidity, float type
    table.float('ph').nullable() // pH level, float type

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}