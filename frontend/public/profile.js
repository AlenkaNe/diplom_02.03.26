// Переключение между вкладками
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Обновляем активные вкладки
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Обновляем активные формы
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tabName}-form`).classList.add('active');
        
        // Скрываем сообщения
        hideMessage();
    });
});

// Обработка логина
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Успешный вход!', 'success');
            setTimeout(() => {
                loadUserInfo();
            }, 1000);
        } else {
            showMessage(data.error || 'Ошибка входа', 'error');
        }
    } catch (error) {
        showMessage('Ошибка соединения: ' + error.message, 'error');
    }
});

// Обработка регистрации
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const first_name = document.getElementById('register-first-name').value || null;
    const last_name = document.getElementById('register-last-name').value || null;
    const gender = document.getElementById('register-gender').value || null;
    const age = document.getElementById('register-age').value ? parseInt(document.getElementById('register-age').value) : null;
    const height_cm = document.getElementById('register-height').value ? parseInt(document.getElementById('register-height').value) : null;
    const weight = document.getElementById('register-weight').value ? parseFloat(document.getElementById('register-weight').value) : null;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                login,
                password,
                first_name,
                last_name,
                gender,
                age,
                height_cm,
                weight
            })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Регистрация успешна!', 'success');
            setTimeout(() => {
                loadUserInfo();
            }, 1000);
        } else {
            const errorMsg = data.error || data.message || 'Ошибка регистрации';
            const detailMsg = data.detail ? ` (${data.detail})` : '';
            showMessage(errorMsg + detailMsg, 'error');
            console.error('Ошибка регистрации:', data);
        }
    } catch (error) {
        showMessage('Ошибка соединения: ' + error.message, 'error');
        console.error('Ошибка при регистрации:', error);
    }
});

// Выход
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            showAuthSection();
            showMessage('Выход выполнен', 'success');
        }
    } catch (error) {
        showMessage('Ошибка выхода: ' + error.message, 'error');
    }
});

// Загрузка информации о пользователе
async function loadUserInfo() {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';

    try {
        const response = await fetch('/api/me', {
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();
            displayUserInfo(user);
            showUserSection();
        } else if (response.status === 401) {
            // Не авторизован - это нормально, показываем форму входа
            showAuthSection();
        } else {
            const data = await response.json().catch(() => ({}));
            console.error('Ошибка загрузки пользователя:', data);
            showAuthSection();
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        showAuthSection();
    } finally {
        loadingEl.style.display = 'none';
    }
}

// Функция для обновления данных пользователя (вызывается из калькулятора)
window.updateUserProfile = async function() {
    await loadUserInfo();
};

function displayUserInfo(user) {
    const content = document.getElementById('user-content');
    content.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Логин</div>
                <div class="info-value">${user.login || 'Не указан'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Имя</div>
                <div class="info-value">${user.first_name || 'Не указано'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Фамилия</div>
                <div class="info-value">${user.last_name || 'Не указана'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Пол</div>
                <div class="info-value">${user.gender === 'мужчина' ? 'Мужской' : user.gender === 'женщина' ? 'Женский' : user.gender || 'Не указан'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Возраст</div>
                <div class="info-value">${user.age || 'Не указан'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Рост</div>
                <div class="info-value">${user.height_cm ? user.height_cm + ' см' : 'Не указан'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Вес</div>
                <div class="info-value">${user.weight ? user.weight + ' кг' : 'Не указан'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Цель</div>
                <div class="info-value">${getGoalLabel(user.goal)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Уровень активности</div>
                <div class="info-value">${getActivityLabel(user.activity_level)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Суточная норма калорий</div>
                <div class="info-value">${user.daily_kcal_norm ? user.daily_kcal_norm + ' ккал' : 'Не рассчитана'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Индекс массы тела (ИМТ)</div>
                <div class="info-value">${user.body_mass_index ? user.body_mass_index : 'Не рассчитан'}</div>
            </div>
        </div>
    `;

    // Заполняем форму редактирования актуальными данными
    document.getElementById('edit-login').value = user.login || '';
    document.getElementById('edit-first-name').value = user.first_name || '';
    document.getElementById('edit-last-name').value = user.last_name || '';
    document.getElementById('edit-gender').value = user.gender === 'мужчина' ? 'male' : user.gender === 'женщина' ? 'female' : '';
    document.getElementById('edit-age').value = user.age || '';
    document.getElementById('edit-height').value = user.height_cm || '';
    document.getElementById('edit-weight').value = user.weight || '';
}

// Переключение видимости формы редактирования
document.getElementById('edit-btn').addEventListener('click', () => {
    const form = document.getElementById('edit-form');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
});

// Сохранение изменений профиля
document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        login: document.getElementById('edit-login').value,
        first_name: document.getElementById('edit-first-name').value || null,
        last_name: document.getElementById('edit-last-name').value || null,
        gender: document.getElementById('edit-gender').value || null,
        age: document.getElementById('edit-age').value ? parseInt(document.getElementById('edit-age').value) : null,
        height_cm: document.getElementById('edit-height').value ? parseInt(document.getElementById('edit-height').value) : null,
        weight: document.getElementById('edit-weight').value ? parseFloat(document.getElementById('edit-weight').value) : null
    };

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Данные профиля обновлены', 'success');
            document.getElementById('edit-form').style.display = 'none';
            await loadUserInfo();
        } else {
            const errorMsg = data.error || data.message || 'Ошибка обновления профиля';
            showMessage(errorMsg, 'error');
        }
    } catch (error) {
        showMessage('Ошибка соединения: ' + error.message, 'error');
    }
});

function getGoalLabel(goal) {
    const goals = {
        'loss': 'Похудение',
        'maintain': 'Поддержание веса',
        'gain': 'Набор массы'
    };
    return goals[goal] || goal || 'Не указана';
}

function getActivityLabel(activityLevel) {
    if (!activityLevel) return 'Не указан';
    
    // Если это русское текстовое значение из базы данных
    const russianToLabel = {
        'минимальная активность': 'Минимальная (сидячий образ жизни)',
        'низкая активность': 'Низкая (легкая активность 1-3 раза в неделю)',
        'средняя активность': 'Средняя (умеренная активность 3-5 раз в неделю)',
        'высокая активность': 'Высокая (высокая активность 6-7 раз в неделю)',
        'очень высокая активность': 'Очень высокая (ежедневные интенсивные тренировки)'
    };
    
    if (russianToLabel[activityLevel]) {
        return russianToLabel[activityLevel];
    }
    
    // Если это числовое значение (для обратной совместимости)
    const activities = {
        '1.2': 'Минимальная (сидячий образ жизни)',
        '1.375': 'Низкая (легкая активность 1-3 раза в неделю)',
        '1.55': 'Средняя (умеренная активность 3-5 раз в неделю)',
        '1.725': 'Высокая (высокая активность 6-7 раз в неделю)',
        '1.9': 'Очень высокая (ежедневные интенсивные тренировки)'
    };
    return activities[activityLevel] || activityLevel;
}

function showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('user-section').style.display = 'none';
}

function showUserSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-section').style.display = 'block';
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
}

function hideMessage() {
    document.getElementById('message').style.display = 'none';
}

// Проверяем авторизацию при загрузке страницы
loadUserInfo();