import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCarById, getFeatures, updateCar } from '../services/CarsAPI';

const EditCar = () => {
    const [features, setFeatures] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [carName, setCarName] = useState('');
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

    const handleOptionChange = (featureId, optionId) => {
        setSelectedOptions(prev => ({
            ...prev,
            [featureId]: parseInt(optionId, 10)
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
            optionIds: Object.values(selectedOptions)
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

                {features.map(feature => (
                    <div key={feature.id}>
                        <h3>{feature.name}</h3>
                        <select
                            value={selectedOptions[feature.id] || ''}
                            onChange={(e) => handleOptionChange(feature.id, e.target.value)}
                        >
                            {feature.options.map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.name} (+${(option.price_in_cents / 100).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                
                <button type="submit">Update Car</button>
            </form>
        </div>
    );
};

export default EditCar;

