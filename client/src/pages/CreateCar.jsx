import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeatures, createCar } from '../services/CarsAPI.jsx';

const CreateCar = () => {
    const [features, setFeatures] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [carName, setCarName] = useState('');
    const [isConvertible, setIsConvertible] = useState(false); // 🔹 added
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const data = await getFeatures();
                setFeatures(data);
                const initialSelections = {};
                data.forEach(feature => {
                    if (feature.options.length > 0) {
                        initialSelections[feature.id] = feature.options[0].id;
                    }
                });
                setSelectedOptions(initialSelections);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatures();
    }, []);

    const handleOptionChange = (featureId, option) => {
        // 🔹 Check if trying to select panoramic roof while not convertible
        if (!isConvertible && option.name.toLowerCase().includes('panoramic sunroof')) {
            alert("Can't choose the Panoramic Roof unless the car is convertible!");
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
            alert('Please give your car a name.');
            return;
        }

        const newCarData = {
            name: carName,
            optionIds: Object.values(selectedOptions),
            isConvertible // optional, send if backend supports it
        };

        try {
            await createCar(newCarData);
            navigate('/cars');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading customization options...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Create Your Custom Car</h1>
            <h1>Note: I am not a car guy, alot of this is most likely incorrect</h1>
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

                <button type="submit">Save Car</button>
            </form>
        </div>
    );
};

export default CreateCar;
