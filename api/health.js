module.exports = function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({ status: 'ok', methodology_version: require('../lib/methodology').VERSION, timestamp: new Date().toISOString() });
};
