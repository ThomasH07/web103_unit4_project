import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCarById } from '../services/CarsAPI';

const CarDetails = () => {
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        const fetchCar = async () => {
            try {
                const data = await getCarById(id);
                setCar(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCar();
    }, [id]);

    const calculateTotalPrice = (options) => {
        if (!Array.isArray(options)) {
            return 0;
        }
        return options.reduce((total, option) => total + (option.price_in_cents || 0), 0) / 100;
    };

    if (loading) return <div className="loading-message">Loading Car Details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!car) return <div className="error-message">Car not found.</div>;

    return (
        <div className="car-details-container">
            <h1>{car.name}</h1>
            <p>
                <strong>Total Price:</strong> ${calculateTotalPrice(car.options).toLocaleString()}
            </p>
            <h3>Configuration:</h3>
            <ul>
                {car.options.map(option => (
                    <li key={option.id}>
                        <strong>{option.feature_name}:</strong> {option.name} <span>(+${(option.price_in_cents / 100).toLocaleString()})</span>
                        <img src={option.image}/>
                    </li>
                ))}
            </ul>
            <div className="car-card-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
                <Link to={`/cars/${id}/edit`} className="btn btn-primary">Edit This Car</Link>
                <Link to="/cars" className="btn">Back to Garage</Link>
            </div>
        </div>
    );
};

export default CarDetails;
