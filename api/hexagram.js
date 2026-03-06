/**
 * 梅花易數時空起卦 API
 */
const { computeHexagram } = require('../lib/hexagram.js');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { draw_datetime } = req.body || {};
    const result = computeHexagram(draw_datetime);
    if (result.error) return res.status(400).json(result);
    res.status(200).json(result);
  } catch (err) {
    console.error('Hexagram error:', err);
    res.status(500).json({ error: '服務器錯誤', message: err.message });
  }
};
