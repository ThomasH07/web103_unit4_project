import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import  { getAllCars, deleteCar} from '../services/CarsAPI.jsx';
import '../App.css'
const calculateTotalPrice = (options) => {
    if (!Array.isArray(options)) return 0;
  
    const totalCents = options.reduce((sum, option) => sum + (option.price_in_cents || 0), 0);
    return totalCents / 100;
  };

const ViewAllCars = () => {
    const [cars, setCars] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const data = await getAllCars();
                setCars(data);
            } catch (err) {
                setError('Failed to fetch cars. Please try again later.');
                console.error(err);
            }
        };
        fetchCars();
    }, []);

    const handleDelete = async (carId) => {
        const originalCars = [...cars];
        try {
            setCars(cars.filter(car => car.id !== carId));
            await deleteCar(carId);
        } catch (err) {
            setError(`Failed to delete car with ID ${carId}.`);
            setCars(originalCars);
            console.error(err);
        }
    };

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="container">
            <div className="garage-header">
                <h1>My Garage</h1>
                <Link to="/" className="btn btn-primary">
                    + Build New Car
                </Link>
            </div>
            <div className="car-grid">
                {cars.map((car) => (
                    <div key={car.id} className="car-card">
                        <div className="car-card-content">
                            <h2>{car.name}</h2>
                            <p>
                                <strong>Total Price:</strong> ${calculateTotalPrice(car.options).toLocaleString()}
                            </p>
                            <ul>
                                {car.options && car.options.map(opt => <li key={opt.id}>- {opt.name}</li>)}
                            </ul>
                        </div>
                        <div className="car-card-actions">
                            <Link to={`/cars/${car.id}`}>View</Link>
                            <Link to={`/cars/${car.id}/edit`}>Edit</Link>
                            <button onClick={() => handleDelete(car.id)} className="btn-danger-link">
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default ViewAllCars;
