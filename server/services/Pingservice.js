const axios = require('axios');

async function pingURL(url) {
  const startTime = Date.now();

  try {
    await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;

    return {
      status: 'up',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'down',
      responseTime,
    };
  }
}

module.exports = { pingURL };