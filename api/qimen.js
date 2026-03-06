const { computeQiMen } = require('../lib/qimen.js');

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { draw_datetime } = req.body || {};
    if (!draw_datetime) {
      return res.status(400).json({ error: '缺少必要參數：draw_datetime' });
    }

    const result = computeQiMen(draw_datetime);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('QiMen error:', error);
    res.status(500).json({ error: '奇門排盤錯誤', message: error.message });
  }
};
