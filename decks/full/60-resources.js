module.exports = (pres, L) => {
  const resources = require('./resources');
  for (const topic of ['getting-started', 'scenarios', 'misconceptions']) resources(pres, L, topic);
};
