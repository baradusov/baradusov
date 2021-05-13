const { promises: fs } = require('fs');
const path = require('path');
const RSS = require('rss');
const matter = require('gray-matter');
const cheerio = require('cheerio');
const renderToString = require('next-mdx-remote-2-1-4/render-to-string');

/**
 * Absolutify links
 * @param {string} input string html of post
 * @returns {string} same string html with absolutified links
 */

const absolutify = (input) => {
  const $ = cheerio.load(input);

  $('a, img').each((i, el) => {
    if (el.name === 'a') {
      const href = $(el).attr('href');
      const absoluteHref = new URL(href, 'https://baradusov.ru');
      $(el).attr('href', absoluteHref);
    }

    if (el.name === 'img') {
      const src = $(el).attr('src');
      const absoluteSrc = new URL(src, 'https://baradusov.ru');
      $(el).attr('src', absoluteSrc);
    }
  });

  const output = $('body').html();

  return output;
};

/**
 * Generate rss feed
 */
const generateRss = async () => {
  const feed = new RSS({
    title: 'Нуриль Барадусов',
    site_url: 'https://baradusov.ru',
    feed_url: 'https://baradusov.ru/feed.xml',
  });

  const posts = await fs.readdir(path.join(__dirname, '..', 'data', 'posts'));

  await Promise.all(
    posts.map(async (name) => {
      const source = await fs.readFile(
        path.join(__dirname, '..', 'data', 'posts', name)
      );
      const { content, data } = matter(source);
      const { renderedOutput } = await renderToString(content);
      const description = absolutify(renderedOutput);

      feed.item({
        title: data.title,
        url: 'https://baradusov.ru/' + name.replace(/\.mdx?/, ''),
        date: data.created,
        description: description,
      });
    })
  );

  await fs.writeFile('./public/feed.xml', feed.xml({ indent: true }));
};

generateRss();
