const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('./db.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'a7f4a8e3b2c9f6d1e0b9c4b3d7f8e2c9a1b4d6f8e9c2a3b9f4d1c7a8c9b2d4fv';
const JWT_EXPIRES = '30d';

// Middleware
app.use(express.json());
app.use(cookieParser());

// Настраиваем прокси на бэкенд
const apiProxy = createProxyMiddleware('/foods', {
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/foods': '/foods'
  }
});

// Используем прокси для запросов к API
app.use('/foods', apiProxy);

// Middleware — проверка авторизации
function authMiddleware(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Токен недействителен' });
  }
}

// Обновление основных данных профиля
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { login, first_name, last_name, gender, age, height_cm, weight } = req.body;

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (login) {
      updateFields.push(`login = $${paramIndex}`);
      updateValues.push(login);
      paramIndex++;
    }

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      updateValues.push(first_name || null);
      paramIndex++;
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`);
      updateValues.push(last_name || null);
      paramIndex++;
    }

    if (gender !== undefined) {
      let genderValue = null;
      if (gender === 'male' || gender === 'мужчина') {
        genderValue = 'мужчина';
      } else if (gender === 'female' || gender === 'женщина') {
        genderValue = 'женщина';
      }
      updateFields.push(`gender = $${paramIndex}`);
      updateValues.push(genderValue);
      paramIndex++;
    }

    if (age !== undefined) {
      updateFields.push(`age = $${paramIndex}`);
      updateValues.push(age || null);
      paramIndex++;
    }

    if (height_cm !== undefined) {
      updateFields.push(`height_cm = $${paramIndex}`);
      updateValues.push(height_cm || null);
      paramIndex++;
    }

    if (weight !== undefined) {
      updateFields.push(`weight = $${paramIndex}`);
      updateValues.push(weight || null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    const userIdParamIndex = updateValues.length + 1;
    updateValues.push(req.userId);

    const query = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${userIdParamIndex}
      RETURNING id, login, first_name, last_name, gender, age, height_cm, weight
    `;

    const result = await pool.query(query, updateValues);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Подтягиваем метрики из user_metrics для единого ответа
    const userRow = await pool.query(
      `SELECT 
         u.id, u.login, u.first_name, u.last_name, u.gender, u.age, u.height_cm, u.weight,
         um.goal, um.activity_level, um.daily_kcal_norm, um.body_mass_index,
         um.daily_protein, um.daily_fat, um.daily_carbs
       FROM users u
       LEFT JOIN user_metrics um ON um.user_id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );

    res.json({ message: 'Данные обновлены', user: userRow.rows[0] });
  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    res.status(500).json({ error: 'Ошибка сервера', message: err.message });
  }
});

// Роуты для аутентификации
// Регистрация
app.post('/api/register', async (req, res) => {
  console.log('POST /api/register - получен запрос');
  const { login, password, first_name, last_name, gender, age, height_cm, weight } = req.body;
  
  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    
    // Формируем динамический запрос в зависимости от того, какие поля заполнены
    const fields = ['login', 'password_hash'];
    const values = [login, hashed];
    
    if (first_name) {
      fields.push('first_name');
      values.push(first_name);
    }
    
    if (last_name) {
      fields.push('last_name');
      values.push(last_name);
    }
    
    // gender передаем только если он указан и соответствует допустимым значениям
    if (gender) {
      let genderValue = null;
      if (gender === 'male' || gender === 'мужчина') {
        genderValue = 'мужчина';
      } else if (gender === 'female' || gender === 'женщина') {
        genderValue = 'женщина';
      }
      
      if (genderValue) {
        fields.push('gender');
        values.push(genderValue);
      }
    }
    
    if (age) {
      fields.push('age');
      values.push(age);
    }
    
    if (height_cm) {
      fields.push('height_cm');
      values.push(height_cm);
    }

    if (weight) {
      fields.push('weight');
      values.push(weight);
    }
    
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const fieldsList = fields.join(', ');
    
    console.log('Поля для вставки:', fieldsList);
    console.log('Значения:', values.map((v, i) => `${fields[i]}=${v === hashed ? '[hashed]' : v}`).join(', '));
    
    const user = await pool.query(
      `INSERT INTO users (${fieldsList})
       VALUES (${placeholders})
       RETURNING id, login, first_name`,
      values
    );

    const token = jwt.sign({ userId: user.rows[0].id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
    });

    res.status(201).json({ message: 'Ок', user: user.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Логин уже занят' });
    console.error('Ошибка регистрации:', err);
    console.error('Детали ошибки:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Ошибка сервера',
      message: err.message,
      detail: process.env.NODE_ENV === 'development' ? err.detail : undefined
    });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE login = $1', [login]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Ок', userId: user.id });
  } catch (err) {
    console.error('Ошибка логина:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выход
app.post('/api/logout', (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({ message: 'Выход успешен' });
});

// Получить текущего пользователя
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT 
         u.id, u.login, u.first_name, u.last_name, u.gender, u.age, u.height_cm, u.weight,
         um.goal, um.activity_level, um.daily_kcal_norm, um.body_mass_index,
         um.daily_protein, um.daily_fat, um.daily_carbs
       FROM users u
       LEFT JOIN user_metrics um ON um.user_id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error('Ошибка получения пользователя:', err);
    console.error('Детали ошибки:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    res.status(500).json({ 
      error: 'Ошибка сервера',
      message: err.message,
      detail: process.env.NODE_ENV === 'development' ? err.detail : undefined
    });
  }
});

// Обновить данные пользователя (цель, уровень активности, норма калорий)
app.put('/api/me/calculator', authMiddleware, async (req, res) => {
  try {
    console.log('PUT /api/me/calculator - получен запрос');
    console.log('req.body:', req.body);
    console.log('req.userId:', req.userId);
    
    const { goal, activity_level, daily_kcal_norm, body_mass_index, daily_protein, daily_fat, daily_carbs, weight } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (goal !== undefined && goal !== null && goal !== '') {
      const goalMap = {
        loss: 'похудение',
        maintain: 'поддержание',
        gain: 'набор',
      };
    
      const goalText = goalMap[goal] || goal; // на всякий случай, если придёт уже русское слово
    
      updateFields.push(`goal = $${paramIndex}`);
      updateValues.push(goalText);
      paramIndex++;
    }
    
    if (activity_level !== undefined && activity_level !== null && activity_level !== '') {
      // Преобразуем числовое значение в текстовое для базы данных
      const activityLevelMap = {
        '1.2': 'минимальная активность',
        '1.375': 'низкая активность',
        '1.55': 'средняя активность',
        '1.725': 'высокая активность',
        '1.9': 'очень высокая активность'
      };
      
      const activityLevelText = activityLevelMap[activity_level] || activity_level;
      
      updateFields.push(`activity_level = $${paramIndex}`);
      updateValues.push(activityLevelText);
      paramIndex++;
    }
    
    if (daily_kcal_norm !== undefined && daily_kcal_norm !== null) {
      updateFields.push(`daily_kcal_norm = $${paramIndex}`);
      updateValues.push(parseInt(daily_kcal_norm));
      paramIndex++;
    }

    if (body_mass_index !== undefined && body_mass_index !== null && body_mass_index !== '') {
      updateFields.push(`body_mass_index = $${paramIndex}`);
      updateValues.push(parseFloat(body_mass_index).toFixed(1));
      paramIndex++;
    }

    if (daily_protein !== undefined && daily_protein !== null) {
      updateFields.push(`daily_protein = $${paramIndex}`);
      updateValues.push(daily_protein);
      paramIndex++;
    }
    if (daily_fat !== undefined && daily_fat !== null) {
      updateFields.push(`daily_fat = $${paramIndex}`);
      updateValues.push(daily_fat);
      paramIndex++;
    }
    if (daily_carbs !== undefined && daily_carbs !== null) {
      updateFields.push(`daily_carbs = $${paramIndex}`);
      updateValues.push(daily_carbs);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    const setClause = updateFields.join(', ');
    const userIdParamIndex = updateValues.length + 1;
    updateValues.push(req.userId);

    // Пытаемся обновить, если записи нет — вставляем новую
    const updateResult = await pool.query(
      `
        UPDATE user_metrics
        SET ${setClause}
        WHERE user_id = $${userIdParamIndex}
        RETURNING goal, activity_level, daily_kcal_norm, body_mass_index, daily_protein, daily_fat, daily_carbs
      `,
      updateValues
    );

    let resultRow = updateResult.rows[0];

    if (updateResult.rowCount === 0) {
      const insertFields = ['user_id'];
      const insertValues = [req.userId];
      const placeholders = ['$1'];
      let insertIndex = 2;

      if (goal !== undefined && goal !== null && goal !== '') {
        const goalMap = { loss: 'похудение', maintain: 'поддержание', gain: 'набор' };
        const goalText = goalMap[goal] || goal;
        insertFields.push('goal');
        insertValues.push(goalText);
        placeholders.push(`$${insertIndex++}`);
      }
      if (activity_level !== undefined && activity_level !== null && activity_level !== '') {
        const activityLevelMap = {
          '1.2': 'минимальная активность',
          '1.375': 'низкая активность',
          '1.55': 'средняя активность',
          '1.725': 'высокая активность',
          '1.9': 'очень высокая активность'
        };
        const activityLevelText = activityLevelMap[activity_level] || activity_level;
        insertFields.push('activity_level');
        insertValues.push(activityLevelText);
        placeholders.push(`$${insertIndex++}`);
      }
      if (daily_kcal_norm !== undefined && daily_kcal_norm !== null) {
        insertFields.push('daily_kcal_norm');
        insertValues.push(parseInt(daily_kcal_norm));
        placeholders.push(`$${insertIndex++}`);
      }
      if (body_mass_index !== undefined && body_mass_index !== null && body_mass_index !== '') {
        insertFields.push('body_mass_index');
        insertValues.push(parseFloat(body_mass_index).toFixed(1));
        placeholders.push(`$${insertIndex++}`);
      }
      if (daily_protein !== undefined && daily_protein !== null) {
        insertFields.push('daily_protein');
        insertValues.push(daily_protein);
        placeholders.push(`$${insertIndex++}`);
      }
      if (daily_fat !== undefined && daily_fat !== null) {
        insertFields.push('daily_fat');
        insertValues.push(daily_fat);
        placeholders.push(`$${insertIndex++}`);
      }
      if (daily_carbs !== undefined && daily_carbs !== null) {
        insertFields.push('daily_carbs');
        insertValues.push(daily_carbs);
        placeholders.push(`$${insertIndex++}`);
      }

      const insertQuery = `
        INSERT INTO user_metrics (${insertFields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING goal, activity_level, daily_kcal_norm, body_mass_index, daily_protein, daily_fat, daily_carbs
      `;

      const insertResult = await pool.query(insertQuery, insertValues);
      resultRow = insertResult.rows[0];
    }

    // Пришёл вес — обновляем в users
    if (weight !== undefined && weight !== null && weight !== '') {
      await pool.query('UPDATE users SET weight = $1 WHERE id = $2', [weight, req.userId]);
    }

    res.json({ message: 'Данные обновлены', metrics: resultRow });
  } catch (err) {
    console.error('Ошибка обновления данных пользователя:', err);
    console.error('Детали ошибки:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });
    res.status(500).json({ 
      error: 'Ошибка сервера', 
      message: err.message,
      detail: process.env.NODE_ENV === 'development' ? err.detail : undefined
    });
  }
});

// Роуты для дневника питания
// Получить типы приемов пищи
app.get('/api/meal-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM meal_types ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения типов приемов пищи:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить продукт в дневник
app.post('/api/diary/add', authMiddleware, async (req, res) => {
  try {
    const { meal_type_id, amount_gram, custom_name, custom_kcal, custom_protein, custom_fat, custom_carbs, eaten_at } = req.body;
    
    if (!meal_type_id || !amount_gram) {
      return res.status(400).json({ error: 'Тип приема пищи и вес обязательны' });
    }
    
    if (!custom_name) {
      return res.status(400).json({ error: 'Название продукта обязательно' });
    }
    
    const date = eaten_at || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `INSERT INTO diary_entries (user_id, meal_type_id, amount_gram, custom_name, custom_kcal, custom_protein, custom_fat, custom_carbs, eaten_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [req.userId, meal_type_id, amount_gram, custom_name, custom_kcal || null, custom_protein || null, custom_fat || null, custom_carbs || null, date]
    );
    
    res.status(201).json({ message: 'Продукт добавлен в дневник', id: result.rows[0].id });
  } catch (err) {
    console.error('Ошибка добавления продукта в дневник:', err);
    res.status(500).json({ error: 'Ошибка сервера', message: err.message });
  }
});

// Получить записи дневника
app.get('/api/diary', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        de.id,
        de.amount_gram,
        de.eaten_at,
        de.added_at,
        de.custom_name,
        de.custom_kcal,
        de.custom_protein,
        de.custom_fat,
        de.custom_carbs,
        mt.name as meal_type_name,
        f.name as food_name,
        f.kcal_per_100,
        f.protein_g,
        f.fat_g,
        f.carbs_g
      FROM diary_entries de
      JOIN meal_types mt ON de.meal_type_id = mt.id
      LEFT JOIN foods f ON de.food_id = f.id
      WHERE de.user_id = $1 AND de.eaten_at = $2
      ORDER BY de.eaten_at DESC, mt.id ASC`,
      [req.userId, queryDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения дневника:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обработчик 404 для API роутов 
app.use('/api/*', (req, res) => {
  console.log(`404 для API: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'API endpoint не найден' });
});

// Обслуживаем статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Отправляем product-search.html для всех других GET запросов 
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-search.html'));
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Перейдите по адресу http://localhost:${PORT}`);
});