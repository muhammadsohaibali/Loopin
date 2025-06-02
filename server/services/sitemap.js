const { SitemapStream } = require('sitemap');
const router = require('express').Router();

router.get('/sitemap.xml', async (req, res) => {
    try {
        const links = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/auth', changefreq: 'monthly', priority: 0.9 },
            { url: '/auth/register', changefreq: 'monthly', priority: 0.9 },
            { url: '/search', changefreq: 'daily', priority: 0.8 },
            { url: '/chats', changefreq: 'monthly', priority: 0.7 },
            { url: '/me', changefreq: 'monthly', priority: 0.5 }
        ];

        const hostname = process.env.NODE_ENV === 'production'
            ? 'https://loopin-xha8.onrender.com'
            : 'http://localhost:3000';

        const stream = new SitemapStream({
            hostname,
            xmlns: {
                news: false,
                image: false,
                video: false
            }
        });

        res.header('Content-Type', 'application/xml');
        stream.pipe(res);
        links.forEach(link => stream.write(link));
        stream.end();

    } catch (e) {
        console.error('Sitemap Error:', e);
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;