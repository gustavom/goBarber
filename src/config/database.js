module.exports = {
  // dialect: 'postgres',
  dialect: 'mysql',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  database: 'gobarber',
  define: {
    timestamps: true,
    underscored: true,
    underscoredall: true,
  },
};
