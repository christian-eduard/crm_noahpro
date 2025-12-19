/**
 * Google Places Service
 * Servicio para buscar negocios en Google Maps usando Places API
 */

const db = require('../config/database');

class GooglePlacesService {
    constructor() {
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
        this.apiKey = null;
    }

    /**
     * Obtener API key de la configuración
     */
    async getApiKey() {
        if (this.apiKey) return this.apiKey;

        const result = await db.query(
            "SELECT api_key FROM hunter_api_config WHERE api_name = 'google_places' AND is_active = TRUE"
        );

        if (result.rows.length === 0 || !result.rows[0].api_key) {
            throw new Error('Google Places API no configurada o desactivada');
        }

        this.apiKey = result.rows[0].api_key;
        return this.apiKey;
    }

    /**
     * Buscar negocios por texto y ubicación
     * @param {string} query - Término de búsqueda (ej: "restaurantes")
     * @param {string} location - Ubicación (ej: "Madrid, España")
     * @param {number} radius - Radio en metros (default: 5000)
     * @param {number} maxResults - Cantidad máxima de resultados deseados (20, 40, 60)
     * @returns {Array} Lista de lugares encontrados
     */
    async searchPlaces(query, location, radius = 5000, maxResults = 20) {
        const apiKey = await this.getApiKey();
        let lat, lng;

        // Verificar si la ubicación son coordenadas (lat,lng)
        const coordPattern = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
        const match = location.match(coordPattern);

        if (match) {
            lat = match[1];
            lng = match[3];
        } else {
            // Geocodificar la ubicación por texto
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (geoData.status !== 'OK' || !geoData.results[0]) {
                throw new Error(`No se pudo geocodificar la ubicación: ${location}`);
            }

            const loc = geoData.results[0].geometry.location;
            lat = loc.lat;
            lng = loc.lng;
        }

        let allResults = [];
        let nextPageToken = null;
        let pagesToFetch = Math.ceil(maxResults / 20);
        let fetchedPages = 0;

        do {
            let searchUrl;
            if (nextPageToken) {
                // Modo paginación: Google requiere el token y la API key
                const searchType = match ? 'nearbysearch' : 'textsearch';
                searchUrl = `${this.baseUrl}/${searchType}/json?pagetoken=${nextPageToken}&key=${apiKey}`;

                // CRITICAL: Google requiere una pequeña espera antes de que el token sea usable
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                if (match) {
                    // Modo Estricto: nearbySearch
                    searchUrl = `${this.baseUrl}/nearbysearch/json?keyword=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${apiKey}&language=es`;
                } else {
                    // Modo Amplio: textsearch
                    searchUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${apiKey}&language=es`;
                }
            }

            const response = await fetch(searchUrl);
            const data = await response.json();

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                throw new Error(`Error de Google Places: ${data.status} - ${data.error_message || ''}`);
            }

            if (data.results) {
                allResults = [...allResults, ...data.results];
            }

            nextPageToken = data.next_page_token;
            fetchedPages++;

        } while (nextPageToken && fetchedPages < pagesToFetch && allResults.length < maxResults);

        return allResults.slice(0, maxResults);
    }

    /**
     * Obtener detalles completos de un lugar
     * @param {string} placeId - ID del lugar de Google
     * @returns {Object} Detalles del lugar
     */
    async getPlaceDetails(placeId) {
        const apiKey = await this.getApiKey();

        const fields = [
            'place_id',
            'name',
            'formatted_address',
            'formatted_phone_number',
            'international_phone_number',
            'website',
            'rating',
            'user_ratings_total',
            'types',
            'opening_hours',
            'reviews',
            'photos',
            'url',
            'address_components'
        ].join(',');

        const url = `${this.baseUrl}/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=es`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            throw new Error(`Error obteniendo detalles: ${data.status}`);
        }

        return this.normalizePlace(data.result);
    }

    /**
     * Normalizar datos de lugar al formato de maps_prospects
     */
    normalizePlace(place) {
        // Extraer ciudad y código postal de address_components
        let city = '';
        let postalCode = '';

        if (place.address_components) {
            for (const component of place.address_components) {
                if (component.types.includes('locality')) {
                    city = component.long_name;
                }
                if (component.types.includes('postal_code')) {
                    postalCode = component.long_name;
                }
            }
        }

        // Determinar tipo de negocio principal
        const businessTypeMap = {
            'restaurant': 'Restaurante',
            'cafe': 'Cafetería',
            'bar': 'Bar',
            'lodging': 'Hotel',
            'store': 'Retail',
            'food': 'Alimentación',
            'bakery': 'Panadería',
            'meal_takeaway': 'Comida para llevar',
            'meal_delivery': 'Delivery'
        };

        let businessType = 'Otro';
        const types = place.types || [];
        for (const type of types) {
            if (businessTypeMap[type]) {
                businessType = businessTypeMap[type];
                break;
            }
        }

        return {
            place_id: place.place_id,
            name: place.name,
            phone: place.formatted_phone_number || place.international_phone_number || null,
            website: place.website || null,
            has_website: !!place.website,
            rating: place.rating || null,
            reviews_count: place.user_ratings_total || 0,
            address: place.formatted_address,
            city,
            postal_code: postalCode,
            business_type: businessType,
            business_types: types,
            google_url: place.url,
            reviews: place.reviews ? place.reviews.slice(0, 5) : [],
            photos: place.photos ? place.photos.slice(0, 5).map(p => ({
                photo_reference: p.photo_reference,
                height: p.height,
                width: p.width,
                url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${this.apiKey}`
            })) : []
        };
    }

    /**
     * Buscar y guardar prospectos en la base de datos
     * @param {string} query - Término de búsqueda
     * @param {string} location - Ubicación
     * @param {number} userId - ID del usuario que busca
     * @param {number} searchId - ID de la sesión de búsqueda
     * @param {number} radius - Radio de búsqueda
     * @param {string} strategy - Estrategia de IA
     * @param {number} maxResults - Límite de resultados
     * @returns {Object} Resultados guardados
     */
    async searchAndSave(query, location, userId, searchId, radius, strategy, maxResults = 20) {
        const places = await this.searchPlaces(query, location, radius, maxResults);
        const saved = [];
        const skipped = [];

        for (const place of places) {
            try {
                // Verificar si ya existe
                const existing = await db.query(
                    'SELECT id FROM maps_prospects WHERE place_id = $1',
                    [place.place_id]
                );

                if (existing.rows.length > 0) {
                    // Update search_id and strategy for the existing prospect to link it to the current search
                    await db.query(
                        `UPDATE maps_prospects 
                         SET search_id = $1, strategy = $2, searched_by = $3, updated_at = NOW() 
                         WHERE id = $4`,
                        [searchId, strategy, userId, existing.rows[0].id]
                    );
                    skipped.push({ name: place.name, reason: 'Ya existe (Vinculado a nueva búsqueda)' });
                    saved.push({ id: existing.rows[0].id, name: place.name }); // Add to saved list so it counts for the user
                    continue;
                }

                // Obtener detalles completos
                const details = await this.getPlaceDetails(place.place_id);

                // Insertar en DB
                const result = await db.query(
                    `INSERT INTO maps_prospects 
                     (place_id, name, phone, website, has_website, rating, reviews_count, 
                      address, city, postal_code, business_type, business_types, 
                      searched_by, search_query, search_id, strategy, photos, reviews)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                     RETURNING id`,
                    [
                        details.place_id,
                        details.name,
                        details.phone,
                        details.website,
                        details.has_website,
                        details.rating,
                        details.reviews_count,
                        details.address,
                        details.city,
                        details.postal_code,
                        details.business_type,
                        JSON.stringify(details.business_types),
                        userId,
                        `${query} en ${location}`,
                        searchId,
                        strategy,
                        JSON.stringify(details.photos),
                        JSON.stringify(details.reviews || [])
                    ]
                );

                saved.push({
                    id: result.rows[0].id,
                    ...details
                });

            } catch (error) {
                console.error(`Error procesando ${place.name}:`, error.message);
                skipped.push({ name: place.name, reason: error.message });
            }
        }

        // History creation moved to leadHunterService
        // await db.query(...)

        // Actualizar estadísticas
        await this.updateUserStats(userId, saved.length);

        return { saved, skipped, total: places.length };
    }

    /**
     * Actualizar estadísticas de uso del usuario
     */
    async updateUserStats(userId, prospectsSearched) {
        const today = new Date().toISOString().split('T')[0];

        await db.query(
            `INSERT INTO hunter_usage_stats (user_id, date, searches_performed, prospects_searched)
             VALUES ($1, $2, 1, $3)
             ON CONFLICT (user_id, date) 
             DO UPDATE SET 
                searches_performed = hunter_usage_stats.searches_performed + 1,
                prospects_searched = hunter_usage_stats.prospects_searched + $3`,
            [userId, today, prospectsSearched]
        );
    }

    /**
     * Probar conexión con la API
     */
    async testConnection() {
        try {
            const apiKey = await this.getApiKey();

            // Hacer una búsqueda simple de prueba
            const testUrl = `${this.baseUrl}/textsearch/json?query=restaurant&location=40.416775,-3.703790&radius=100&key=${apiKey}`;
            const response = await fetch(testUrl);
            const data = await response.json();

            if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
                // Actualizar estado de test
                await db.query(
                    `UPDATE hunter_api_config 
                     SET last_tested_at = NOW(), test_result = 'success' 
                     WHERE api_name = 'google_places'`
                );
                return { success: true, message: 'Conexión exitosa con Google Places API' };
            } else {
                await db.query(
                    `UPDATE hunter_api_config 
                     SET last_tested_at = NOW(), test_result = 'failed' 
                     WHERE api_name = 'google_places'`
                );
                return { success: false, message: `Error: ${data.status} - ${data.error_message || ''}` };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = new GooglePlacesService();
