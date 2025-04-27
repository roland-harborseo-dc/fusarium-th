/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const SensorsController = () => import("#controllers/sensors_controller")

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('sensors/:id', [SensorsController, 'getSensor'])
router.get('sensors', [SensorsController, 'getSensor'])
router.post('notifications/:id', [SensorsController, 'readNotification'])
router.post('resetnotifications', [SensorsController, 'resetNotifications'])
router.get('notifications', [SensorsController, 'getNotifications'])

router.post('createSensor', [SensorsController, 'createSensor'])
router.post('pollSensors', [SensorsController, 'pollSensors'])
