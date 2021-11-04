const config = {
  host: 'postgres',
  port: 5432,
  db: 'votes',
  user: 'postgres',
};

// Exported objects are copies
module.exports.config = () => {
  return Object.assign({}, config);
};
