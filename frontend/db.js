const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || process.env.DB_USER || 'postgres',
  host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
  database: process.env.PGDATABASE || process.env.DB_NAME || 'food_project',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
});

// Обработка ошибок подключения
pool.on('error', (err, client) => {
  console.error('Неожиданная ошибка на клиенте PostgreSQL:', err);
  process.exit(-1);
});

// Проверка подключения при запуске (в тестах не делаем реальных коннектов)
if (process.env.NODE_ENV !== 'test') {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Ошибка подключения к базе данных:', err.message);
      console.error('Убедитесь, что PostgreSQL запущен и база данных food_project существует');
    } else {
      console.log('Подключение к базе данных успешно установлено');
    }
  });
}

module.exports = { pool };

