import express from 'express';
import carsController from '../controllers/cars.js';


const router = express.Router();

router.get('/', (req, res) => {
    res.send('/api works lets goo!')
})

router.get('/features', carsController.getAllFeatures);

router.get('/cars', carsController.getAllCustomCars);

router.get('/cars/:id', carsController.getCustomCarById);

router.post('/cars', carsController.createCustomCar);

router.put('/cars/:id', carsController.updateCustomCar);

router.delete('/cars/:id', carsController.deleteCustomCar);


export default router;
