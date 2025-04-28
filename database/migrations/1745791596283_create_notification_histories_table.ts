import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notification_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('sensor_history_id').unsigned().references('id').inTable('sensors_histories')
      table.string('message')
      table.boolean('read')
      table.specificType('body', 'LONGTEXT' )

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}