const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper tin tức công nghệ & kinh tế từ các nguồn RSS uy tín tại Việt Nam
 */
async function getLatestNews(category = 'tech') {
  const feeds = [
    { source: 'VnExpress Số Hóa', url: 'https://vnexpress.net/rss/so-hoa.rss', cat: 'tech' },
    { source: 'VnExpress Kinh Doanh', url: 'https://vnexpress.net/rss/kinh-doanh.rss', cat: 'business' },
    { source: 'Tuổi Trẻ Công Nghệ', url: 'https://tuoitre.vn/rss/nhip-song-so.rss', cat: 'tech' }
  ];

  const targetFeeds = category === 'all' ? feeds : feeds.filter(f => f.cat === category || f.cat === 'tech');

  const articles = [];

  for (const feed of targetFeeds) {
    try {
      const response = await axios.get(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 7000
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data, { xmlMode: true });
        
        $('item').slice(0, 4).each((idx, elem) => {
          const title = $(elem).find('title').text().trim();
          const rawDesc = $(elem).find('description').text().trim();
          const link = $(elem).find('link').text().trim();
          const pubDate = $(elem).find('pubDate').text().trim();

          // Tách text thuần từ description (thường chứa thẻ <img> hoặc CDATA)
          const desc$ = cheerio.load(rawDesc);
          const cleanDesc = desc$.text().trim();

          if (title && link) {
            articles.push({
              title,
              description: cleanDesc,
              link,
              pubDate,
              source: feed.source
            });
          }
        });
      }
    } catch (err) {
      console.warn(`[NewsScraper] Không thể lấy tin từ ${feed.source}: ${err.message}`);
    }
  }

  // Loại bỏ các tin trùng lặp tiêu đề
  const uniqueArticles = [];
  const seen = new Set();
  for (const a of articles) {
    if (!seen.has(a.title)) {
      seen.add(a.title);
      uniqueArticles.push(a);
    }
  }

  return uniqueArticles.slice(0, 5);
}

module.exports = {
  getLatestNews
};
