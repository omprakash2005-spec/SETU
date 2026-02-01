import * as locationModel from '../models/locationModel.js';

/**
 * Save or update user location
 * POST /api/locations
 */
export const saveUserLocation = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { latitude, longitude, location_type, address } = req.body;

        // Validate required fields
        if (!latitude || !longitude || !location_type) {
            return res.status(400).json({
                success: false,
                message: 'Latitude, longitude, and location_type are required',
            });
        }

        // Validate location_type
        if (location_type !== 'manual' && location_type !== 'gps') {
            return res.status(400).json({
                success: false,
                message: 'location_type must be either "manual" or "gps"',
            });
        }

        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates',
            });
        }

        const location = await locationModel.saveLocation(userId, {
            latitude,
            longitude,
            location_type,
            address: address || null,
        });

        res.status(200).json({
            success: true,
            message: 'Location saved successfully',
            location,
        });
    } catch (error) {
        console.error('Save location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save location',
        });
    }
};

/**
 * Get current user's location
 * GET /api/locations/me
 */
export const getMyLocation = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const location = await locationModel.getUserLocation(userId);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found',
            });
        }

        res.status(200).json({
            success: true,
            location,
        });
    } catch (error) {
        console.error('Get my location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch location',
        });
    }
};

/**
 * Get nearby connected users' locations
 * GET /api/locations/nearby
 */
export const getNearbyConnections = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { radius } = req.query; // Optional radius in km, default 50

        // First, get user's own location
        const userLocation = await locationModel.getUserLocation(userId);

        if (!userLocation) {
            return res.status(400).json({
                success: false,
                message: 'Please set your location first',
                needsLocation: true,
            });
        }

        const radiusKm = radius ? parseFloat(radius) : 50;

        // Get nearby connected users
        const nearbyUsers = await locationModel.getNearbyConnectedLocations(
            userId,
            userLocation.latitude,
            userLocation.longitude,
            radiusKm
        );

        res.status(200).json({
            success: true,
            userLocation: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
            },
            nearbyUsers,
            count: nearbyUsers.length,
        });
    } catch (error) {
        console.error('Get nearby connections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch nearby connections',
        });
    }
};

/**
 * Delete user's location
 * DELETE /api/locations/me
 */
export const deleteMyLocation = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const deleted = await locationModel.deleteLocation(userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Location not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Location deleted successfully',
        });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete location',
        });
    }
};
