const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'food_project',
  password: 'postgres',
  port: 5432,
});

// Обработка ошибок подключения
pool.on('error', (err, client) => {
  console.error('Неожиданная ошибка на клиенте PostgreSQL:', err);
  process.exit(-1);
});

// Проверка подключения при запуске
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
    console.error('Убедитесь, что PostgreSQL запущен и база данных food_project существует');
  } else {
    console.log('Подключение к базе данных успешно установлено');
  }
});

module.exports = { pool };

