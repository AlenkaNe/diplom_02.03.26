document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculator-form');
    const resultsSection = document.getElementById('results-section');
    const tdeeValue = document.getElementById('tdee-value');
    const proteinValue = document.getElementById('protein-value');
    const fatValue = document.getElementById('fat-value');
    const carbsValue = document.getElementById('carbs-value');
    const chartCanvas = document.getElementById('macros-chart');
    const bodyMassIndexValue = document.getElementById('body-mass-index-value');
    const bmiPointer = document.getElementById('bmi-pointer');
    const bmiMeaning = document.getElementById('bmi-meaning');
    
    // Инициализируем размер canvas
    chartCanvas.width = 200;
    chartCanvas.height = 200;

    // Загружаем сохраненные данные пользователя при загрузке страницы
    loadUserCalculatorData();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const gender = document.getElementById('gender').value;
        const age = parseInt(document.getElementById('age').value);
        const height = parseInt(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const activity = parseFloat(document.getElementById('activity').value);
        const goal = document.getElementById('goal').value;
        const formula = document.getElementById('formula').value;

        // Рассчитываем BMR по выбранной формуле
        let bmr;
        if (formula === 'harris') {
            // Формула Харриса-Бенедикта
            if (gender === 'male') {
                bmr = 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age);
            } else {
                bmr = 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age);
            }
        } else {
            // Формула Миффлина-Сан Жеора
            if (gender === 'male') {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }
        }

        // Рассчитываем TDEE (умножаем BMR на коэффициент активности)
        let tdee = bmr * activity;

        // Корректируем TDEE в зависимости от цели
        if (goal === 'loss') {
            tdee = tdee * 0.9; // Уменьшаем на 10%
        } else if (goal === 'gain') {
            tdee = tdee * 1.1; // Увеличиваем на 10%
        }
        // Для поддержания веса оставляем без изменений

        // Рассчитываем БЖУ в зависимости от цели
        let proteinPercent, fatPercent, carbsPercent;
        if (goal === 'loss') {
            proteinPercent = 0.40;
            fatPercent = 0.25;
            carbsPercent = 0.35;
        } else if (goal === 'gain') {
            proteinPercent = 0.30;
            fatPercent = 0.20;
            carbsPercent = 0.50;
        } else {
            // Поддержание веса
            proteinPercent = 0.30;
            fatPercent = 0.30;
            carbsPercent = 0.40;
        }

        const proteinKcal = Math.round(tdee * proteinPercent);
        const fatKcal = Math.round(tdee * fatPercent);
        const carbsKcal = Math.round(tdee * carbsPercent);

        // Переводим ккал в граммы: белок и углеводы — 4 ккал/г, жиры — 9 ккал/г
        const proteinGrams = Math.round(proteinKcal / 4);
        const fatGrams = Math.round(fatKcal / 9);
        const carbsGrams = Math.round(carbsKcal / 4);

        const heightM = height / 100; // перевод см в метры
        const bmiRaw = heightM > 0 ? weight / (heightM * heightM) : 0;
        const roundedBmi = Number(bmiRaw.toFixed(2));

        updateBmiUI(roundedBmi);
        // Отображаем результаты
        bodyMassIndexValue.textContent = roundedBmi;
        const roundedTdee = Math.round(tdee);
        tdeeValue.textContent = roundedTdee;
        proteinValue.textContent = proteinKcal + ' ккал';
        fatValue.textContent = fatKcal + ' ккал';
        carbsValue.textContent = carbsKcal + ' ккал';

        // Показываем секцию результатов
        resultsSection.classList.add('show');

        // Рисуем круговую диаграмму
        drawMacrosChart(proteinPercent, fatPercent, carbsPercent);

        // Сохраняем данные в базу данных
        saveCalculatorData(goal, activity, roundedTdee, weight, proteinGrams, fatGrams, carbsGrams);
    });

    async function saveCalculatorData(goal, activityLevel, dailyKcalNorm, weightValue, dailyProtein, dailyFat, dailyCarbs) {
        try {
            const response = await fetch('/api/me/calculator', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    goal: goal,
                    activity_level: activityLevel.toString(),
                    daily_kcal_norm: dailyKcalNorm,
                    daily_protein: dailyProtein,
                    daily_fat: dailyFat,
                    daily_carbs: dailyCarbs,
                    body_mass_index: Number(bodyMassIndexValue.textContent.replace(',', '.')),
                    weight: weightValue
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Данные калькулятора сохранены:', data);
                
                // Обновляем профиль, если он открыт в другой вкладке
                if (window.updateUserProfile && typeof window.updateUserProfile === 'function') {
                    // Если функция доступна (страница профиля открыта), обновляем её
                    // Но это не сработает для другой вкладки, поэтому просто логируем
                }
                
                // Показываем уведомление пользователю
                showSaveNotification('Данные сохранены в профиль');
            } else if (response.status === 401) {
                console.log('Необходима авторизация для сохранения данных');
                showSaveNotification('Для сохранения данных необходимо войти в систему', 'error');
            } else {
                const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
                console.error('Ошибка сохранения данных:', error);
                console.error('Статус ответа:', response.status);
                showSaveNotification('Ошибка сохранения данных: ' + (error.message || error.error || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Ошибка при сохранении данных калькулятора:', error);
            showSaveNotification('Ошибка соединения', 'error');
        }
    }

    function showSaveNotification(message, type = 'success') {
        // Создаем уведомление, если его еще нет
        let notification = document.getElementById('save-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'save-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 4px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
        notification.style.opacity = '1';
        notification.style.display = 'block';
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    }

    function drawMacrosChart(proteinPercent, fatPercent, carbsPercent) {
        const ctx = chartCanvas.getContext('2d');
        const centerX2 = chartCanvas.width / 2;
        const centerY2 = chartCanvas.height / 2;
        const radius2 = Math.min(chartCanvas.width, chartCanvas.height) / 2 - 10;

        // Цвета для макронутриентов
        const colors = {
            protein: '#51adeb',
            fat: '#e7b93c',
            carbs: '#ee4d3b'
        };

        // Очищаем canvas
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

        // Рисуем круговую диаграмму
        let currentAngle = -Math.PI / 2; // Начинаем сверху

        // Белки
        ctx.beginPath();
        ctx.moveTo(centerX2, centerY2);
        ctx.arc(centerX2, centerY2, radius2, currentAngle, currentAngle + (proteinPercent * 2 * Math.PI));
        ctx.closePath();
        ctx.fillStyle = colors.protein;
        ctx.fill();

        currentAngle += proteinPercent * 2 * Math.PI;

        // Жиры
        ctx.beginPath();
        ctx.moveTo(centerX2, centerY2);
        ctx.arc(centerX2, centerY2, radius2, currentAngle, currentAngle + (fatPercent * 2 * Math.PI));
        ctx.closePath();
        ctx.fillStyle = colors.fat;
        ctx.fill();

        currentAngle += fatPercent * 2 * Math.PI;

        // Углеводы
        ctx.beginPath();
        ctx.moveTo(centerX2, centerY2);
        ctx.arc(centerX2, centerY2, radius2, currentAngle, currentAngle + (carbsPercent * 2 * Math.PI));
        ctx.closePath();
        ctx.fillStyle = colors.carbs;
        ctx.fill();

        // Рисуем белый круг в центре для эффекта "пончика"
        ctx.beginPath();
        ctx.arc(centerX2, centerY2, radius2 * 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    function updateBmiUI(bmi) {
        const minBmi = 12;
        const maxBmi = 45;
        const clamped = Math.max(minBmi, Math.min(maxBmi, bmi));
        const position = ((clamped - minBmi) / (maxBmi - minBmi)) * 100;
        bmiPointer.style.left = `${position}%`;

        let meaning = '';
        if (bmi < 18.5) {
            meaning = 'Недостаточный вес.';
        } else if (bmi < 25) {
            meaning = 'Нормальный вес.';
        } else if (bmi < 30) {
            meaning = 'Избыточный вес (предожирение).';
        } else {
            meaning = 'Ожирение (I степени — 30-34.9, II — 35-39.9, III — 40+).';
        }
        bmiMeaning.textContent = meaning;
    }

    async function loadUserCalculatorData() {
        try {
            const response = await fetch('/api/me', {
                credentials: 'include'
            });

            if (response.ok) {
                const user = await response.json();
                
                // Заполняем форму сохраненными данными
                if (user.goal) {
                    document.getElementById('goal').value = user.goal;
                }
                if (user.activity_level) {
                    document.getElementById('activity').value = user.activity_level;
                }
                if (user.daily_kcal_norm) {
                    // Если есть сохраненная норма калорий, можно показать результаты
                    // Но лучше не показывать автоматически, чтобы пользователь мог пересчитать
                }
            }
        } catch (error) {
            // Игнорируем ошибки при загрузке данных (пользователь может быть не авторизован)
            console.log('Не удалось загрузить сохраненные данные калькулятора');
        }
    }
});

