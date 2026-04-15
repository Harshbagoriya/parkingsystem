const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'parksmart',
  process.env.MYSQL_USER     || 'root',
  process.env.MYSQL_PASSWORD || '',
  {
    host:    process.env.MYSQL_HOST || 'localhost',
    port:    process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool:    { max: 5, min: 0, acquire: 30000, idle: 10000 },
  }
)

module.exports = { sequelize }
