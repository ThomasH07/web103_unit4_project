import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCarById, getFeatures, updateCar } from '../services/CarsAPI.jsx';

const EditCar = () => {
    const [features, setFeatures] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [carName, setCarName] = useState('');
    const [isConvertible, setIsConvertible] = useState(false); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [carData, featuresData] = await Promise.all([
                    getCarById(id),
                    getFeatures()
                ]);

                setCarName(carData.name);
                setFeatures(featuresData);

                // If backend supports convertible flag
                if (carData.isConvertible !== undefined) {
                    setIsConvertible(carData.isConvertible);
                }

                const initialSelections = carData.options.reduce((acc, option) => {
                    acc[option.feature_id] = option.id;
                    return acc;
                }, {});
                setSelectedOptions(initialSelections);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleOptionChange = (featureId, option) => {
        if (!isConvertible && option.name.toLowerCase().includes('convertible soft top')) {
            alert("Can't choose the Convertible Soft Top unless the car is convertible!");
            return;
        }

        setSelectedOptions(prev => ({
            ...prev,
            [featureId]: option.id
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!carName.trim()) {
            alert('Car name cannot be empty.');
            return;
        }

        const updatedCarData = {
            name: carName,
            optionIds: Object.values(selectedOptions),
            isConvertible // optional if backend supports it
        };

        try {
            await updateCar(id, updatedCarData);
            navigate('/cars');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading car for editing...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Edit {carName}</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        Car Name:
                        <input
                            type="text"
                            value={carName}
                            onChange={(e) => setCarName(e.target.value)}
                            required
                        />
                    </label>
                </div>

                <div style={{ margin: '1rem 0' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={isConvertible}
                            onChange={() => setIsConvertible(!isConvertible)}
                        />
                        {' '}Is Convertible?
                    </label>
                </div>

                {features.map(feature => (
                    <div key={feature.id}>
                        <h3>{feature.name}</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {feature.options.map(option => {
                                const isSelected = selectedOptions[feature.id] === option.id;
                                return (
                                    <label
                                        key={option.id}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`feature-${feature.id}`}
                                            value={option.id}
                                            checked={isSelected}
                                            onChange={() => handleOptionChange(feature.id, option)}
                                            style={{ display: 'none' }}
                                        />
                                        <img
                                            src={option.image}
                                            alt={option.name}
                                            style={{
                                                width: '120px',
                                                height: '120px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                border: isSelected ? '4px solid #007BFF' : '2px solid transparent',
                                                transition: 'border 0.2s ease'
                                            }}
                                        />
                                        <span>{option.name}</span>
                                        <small>(+${(option.price_in_cents / 100).toLocaleString()})</small>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <button type="submit">Update Car</button>
            </form>
        </div>
    );
};

export default EditCar;
