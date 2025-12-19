/**
 * Social Media Intelligence Service
 * Extrae datos de redes sociales usando API oficial o scraping como fallback
 */

const db = require('../config/database');

class SocialMediaService {
    constructor() {
        this.instagramConfig = null;
        this.facebookConfig = null;
    }

    /**
     * Cargar configuración de APIs desde la base de datos
     */
    async loadConfig() {
        if (!this.instagramConfig) {
            const igResult = await db.query(
                "SELECT api_key, api_secret, config_json FROM hunter_api_config WHERE api_name = 'instagram_graph'"
            );
            if (igResult.rows.length > 0) {
                const row = igResult.rows[0];
                this.instagramConfig = {
                    accessToken: row.api_key || row.config_json?.accessToken,
                    businessAccountId: row.config_json?.businessAccountId,
                    method: row.config_json?.method || 'api'
                };
            }
        }

        if (!this.facebookConfig) {
            const fbResult = await db.query(
                "SELECT api_key, api_secret, config_json FROM hunter_api_config WHERE api_name = 'facebook_graph'"
            );
            if (fbResult.rows.length > 0) {
                const row = fbResult.rows[0];
                this.facebookConfig = {
                    accessToken: row.api_key || row.config_json?.accessToken,
                    appId: row.config_json?.appId,
                    appSecret: row.api_secret || row.config_json?.appSecret
                };
            }
        }
    }

    /**
     * Extrae el handle de Instagram/Facebook desde la web o nombre del negocio
     * @param {string} website - URL del sitio web
     * @param {string} name - Nombre del negocio
     * @param {string} businessType - Tipo de negocio
     * @returns {Object} { handle, platform } o null
     */
    async extractHandle(website, name, businessType) {
        // Estrategia 1: Buscar en URL del website
        if (website) {
            const instagramMatch = website.match(/instagram\.com\/([^\/\?#]+)/i);
            if (instagramMatch) {
                return { handle: instagramMatch[1].replace('@', ''), platform: 'instagram' };
            }

            const facebookMatch = website.match(/facebook\.com\/([^\/\?#]+)/i);
            if (facebookMatch) {
                return { handle: facebookMatch[1], platform: 'facebook' };
            }

            const tiktokMatch = website.match(/tiktok\.com\/@([^\/\?#]+)/i);
            if (tiktokMatch) {
                return { handle: tiktokMatch[1], platform: 'tiktok' };
            }
        }

        // Estrategia 2: Scraping ligero del HTML
        if (website) {
            try {
                const socialLinks = await this.scrapeSocialLinksFromWeb(website);
                if (socialLinks.instagram) {
                    return { handle: socialLinks.instagram, platform: 'instagram' };
                }
                if (socialLinks.facebook) {
                    return { handle: socialLinks.facebook, platform: 'facebook' };
                }
            } catch (error) {
                console.warn('Error scraping social links:', error.message);
            }
        }

        // Estrategia 3: Inferencia por nombre del negocio
        if (name) {
            const normalized = this.normalizeBusinessName(name);
            // Retornar como posible handle para verificar después
            return { handle: normalized, platform: 'instagram', inferred: true };
        }

        return null;
    }

    /**
     * Normaliza el nombre del negocio para inferir un posible handle
     * "Restaurante La Esquina" → "laesquina"
     */
    normalizeBusinessName(name) {
        return name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .replace(/restaurante|bar|cafeteria|cafe|hotel|tienda|peluqueria/gi, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    /**
     * Scraping ligero: Busca enlaces a redes sociales en el HTML
     */
    async scrapeSocialLinksFromWeb(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NoahProBot/2.0)' }
            });

            clearTimeout(timeoutId);

            if (!response.ok) return {};

            const html = await response.text();

            const links = {
                instagram: null,
                facebook: null,
                tiktok: null
            };

            // Buscar enlaces a Instagram
            const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
            if (igMatch) links.instagram = igMatch[1].replace('@', '');

            // Buscar enlaces a Facebook
            const fbMatch = html.match(/facebook\.com\/([a-zA-Z0-9.]+)/i);
            if (fbMatch && !fbMatch[1].includes('sharer')) {
                links.facebook = fbMatch[1];
            }

            // Buscar enlaces a TikTok
            const ttMatch = html.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/i);
            if (ttMatch) links.tiktok = ttMatch[1];

            return links;
        } catch (error) {
            console.warn('Scraping failed:', error.message);
            return {};
        }
    }

    /**
     * Obtiene estadísticas de Instagram usando Graph API o scraping
     * @param {string} handle - Usuario de Instagram (sin @)
     * @returns {Object} Estadísticas o null
     */
    async getInstagramStats(handle) {
        if (!handle) return null;

        await this.loadConfig();

        // Intentar primero con API oficial
        if (this.instagramConfig?.accessToken && this.instagramConfig?.businessAccountId) {
            try {
                const apiStats = await this.getInstagramStatsViaAPI(handle);
                if (apiStats) {
                    apiStats.fetch_method = 'api';
                    return apiStats;
                }
            } catch (error) {
                console.warn('Instagram API failed, falling back to scraping:', error.message);
            }
        }

        // Fallback a scraping
        try {
            const scrapedStats = await this.getInstagramStatsViaScraping(handle);
            if (scrapedStats) {
                scrapedStats.fetch_method = 'scraping';
                return scrapedStats;
            }
        } catch (error) {
            console.error('Instagram scraping also failed:', error.message);
        }

        return null;
    }

    /**
     * Obtiene stats de Instagram usando la Graph API oficial
     * Requiere: Business Account + Access Token
     */
    async getInstagramStatsViaAPI(handle) {
        const { accessToken, businessAccountId } = this.instagramConfig;

        // Business Discovery endpoint
        const url = `https://graph.facebook.com/v18.0/${businessAccountId}?fields=business_discovery.username(${handle}){followers_count,media_count,media{timestamp,like_count,comments_count,caption},biography,website,is_verified}&access_token=${accessToken}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Instagram API error: ${response.status}`);
        }

        const data = await response.json();
        const discovery = data.business_discovery;

        if (!discovery) {
            throw new Error('Business discovery data not found');
        }

        // Calcular engagement
        const recentPosts = discovery.media?.data?.slice(0, 10) || [];
        const totalLikes = recentPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
        const totalComments = recentPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const avgLikes = recentPosts.length > 0 ? totalLikes / recentPosts.length : 0;
        const avgComments = recentPosts.length > 0 ? totalComments / recentPosts.length : 0;
        const engagementRate = discovery.followers_count > 0
            ? ((avgLikes + avgComments) / discovery.followers_count) * 100
            : 0;

        // Último post
        const lastPost = recentPosts[0];
        const lastPostDate = lastPost ? new Date(lastPost.timestamp).toISOString().split('T')[0] : null;

        // Determinar si está activo (posteó en últimos 30 días)
        const daysSinceLastPost = lastPostDate
            ? Math.floor((Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
            : 9999;
        const isActive = daysSinceLastPost <= 30;

        return {
            platform: 'instagram',
            followers_count: discovery.followers_count,
            media_count: discovery.media_count,
            last_post_date: lastPostDate,
            last_post_caption: lastPost?.caption?.substring(0, 100),
            engagement_rate: parseFloat(engagementRate.toFixed(2)),
            avg_likes: Math.round(avgLikes),
            avg_comments: Math.round(avgComments),
            is_verified: discovery.is_verified,
            is_business: true, // Si usamos Business Discovery, es business
            is_active: isActive,
            bio: discovery.biography,
            external_url: discovery.website,
            last_updated: new Date().toISOString()
        };
    }

    /**
     * Obtiene stats de Instagram mediante scraping ligero
     * Método de respaldo si no hay API configurada
     */
    async getInstagramStatsViaScraping(handle) {
        try {
            // Nota: Instagram ha bloqueado el scraping directo del feed.
            // Esta es una implementación básica que solo obtiene datos públicos del perfil.

            const url = `https://www.instagram.com/${handle}/?__a=1&__d=dis`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Scraping failed: ${response.status}`);
            }

            const data = await response.json();
            const user = data.graphql?.user || data.user;

            if (!user) {
                throw new Error('User data not found in response');
            }

            // Calcular actividad reciente
            const lastPost = user.edge_owner_to_timeline_media?.edges?.[0]?.node;
            const lastPostDate = lastPost
                ? new Date(lastPost.taken_at_timestamp * 1000).toISOString().split('T')[0]
                : null;

            const daysSinceLastPost = lastPostDate
                ? Math.floor((Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24))
                : 9999;

            return {
                platform: 'instagram',
                followers_count: user.edge_followed_by?.count || 0,
                following_count: user.edge_follow?.count || 0,
                media_count: user.edge_owner_to_timeline_media?.count || 0,
                last_post_date: lastPostDate,
                is_verified: user.is_verified || false,
                is_business: user.is_business_account || false,
                is_active: daysSinceLastPost <= 30,
                bio: user.biography,
                external_url: user.external_url,
                last_updated: new Date().toISOString(),
                engagement_rate: 0 // No podemos calcular sin likes
            };
        } catch (error) {
            console.error('Instagram scraping error:', error.message);
            return null;
        }
    }

    /**
     * Calcula engagement rate
     */
    calculateEngagement(stats) {
        if (!stats || !stats.followers_count) return 0;
        const avgInteractions = (stats.avg_likes || 0) + (stats.avg_comments || 0);
        return parseFloat(((avgInteractions / stats.followers_count) * 100).toFixed(2));
    }

    /**
     * Determina si una cuenta está activa basándose en última actividad
     */
    isAccountActive(lastPostDate) {
        if (!lastPostDate) return false;
        const daysSince = Math.floor((Date.now() - new Date(lastPostDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 30; // Activo si posteó en últimos 30 días
    }

    /**
     * Test de conexión a Instagram API
     */
    async testConnection() {
        await this.loadConfig();

        if (!this.instagramConfig?.accessToken) {
            return { success: false, message: 'Access Token no configurado' };
        }

        try {
            // Test con cuenta conocida
            const testHandle = 'instagram'; // Cuenta oficial de Instagram
            const stats = await this.getInstagramStatsViaAPI(testHandle);

            if (stats && stats.followers_count > 0) {
                return {
                    success: true,
                    message: `✓ Conexión exitosa. Test con @${testHandle}: ${stats.followers_count} seguidores`,
                    method: 'api'
                };
            } else {
                return { success: false, message: 'API responde pero sin datos' };
            }
        } catch (error) {
            // Intentar con scraping
            try {
                const scrapedStats = await this.getInstagramStatsViaScraping('instagram');
                if (scrapedStats) {
                    return {
                        success: true,
                        message: '⚠️ API falló, pero scraping funciona',
                        method: 'scraping'
                    };
                }
            } catch (scrapingError) {
                return {
                    success: false,
                    message: `❌ Ambos métodos fallaron. API: ${error.message}, Scraping: ${scrapingError.message}`
                };
            }
        }
    }
}

module.exports = new SocialMediaService();
