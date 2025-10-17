const API_BASE_URL = 'http://localhost:3000/api';

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const getFeatures = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/features`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching features:', error);
        throw error;
    }
};

export const getAllCars = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/cars`);
        return await handleResponse(response);
    } catch (error) {
        console.error('Error fetching all cars:', error);
        throw error;
    }
};

export const getCarById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cars/${id}`);
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error fetching car with id ${id}:`, error);
        throw error;
    }
};

export const createCar = async (carData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(carData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error creating car:', error);
        throw error;
    }
};

export const updateCar = async (id, carData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cars/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(carData),
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error updating car with id ${id}:`, error);
        throw error;
    }
};

export const deleteCar = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cars/${id}`, {
            method: 'DELETE',
        });
        return await handleResponse(response);
    } catch (error) {
        console.error(`Error deleting car with id ${id}:`, error);
        throw error;
    }
};

