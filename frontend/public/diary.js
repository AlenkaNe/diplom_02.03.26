// Устанавливаем сегодняшнюю дату по умолчанию
document.getElementById('date-input').value = new Date().toISOString().split('T')[0];

// Загружаем данные при изменении даты
document.getElementById('date-input').addEventListener('change', loadDiary);

// Загружаем данные при загрузке страницы (будет вызвано после loadMealTypes)

async function loadDiary() {
    const date = document.getElementById('date-input').value;
    const loadingEl = document.getElementById('loading');
    const contentEl = document.getElementById('diary-content');
    const errorEl = document.getElementById('error-message');

    loadingEl.style.display = 'block';
    contentEl.style.display = 'none';
    errorEl.style.display = 'none';

    try {
        const response = await fetch(`/api/diary?date=${date}`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            errorEl.textContent = 'Необходима авторизация. Пожалуйста, войдите в систему.';
            errorEl.style.display = 'block';
            loadingEl.style.display = 'none';
            return;
        }

        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }

        const entries = await response.json();
        displayEntries(entries);
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
    } catch (error) {
        console.error('Ошибка:', error);
        errorEl.textContent = 'Ошибка загрузки данных: ' + error.message;
        errorEl.style.display = 'block';
        loadingEl.style.display = 'none';
    }
}

let mealTypesList = [];

async function loadMealTypes() {
    try {
        const response = await fetch('/api/meal-types', {
            credentials: 'include'
        });
        if (response.ok) {
            mealTypesList = await response.json();
        }
    } catch (error) {
        console.error('Ошибка загрузки типов приемов пищи:', error);
    }
}

function displayEntries(entries) {
    const container = document.getElementById('diary-entries');
    const summaryEl = document.getElementById('summary');
    
    // Группируем записи по типам приемов пищи
    const grouped = {};
    let totalKcal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    entries.forEach(entry => {
        if (!grouped[entry.meal_type_name]) {
            grouped[entry.meal_type_name] = [];
        }
        grouped[entry.meal_type_name].push(entry);

        // Рассчитываем нутриенты - используем только custom поля
        const amount = parseFloat(entry.amount_gram);
        let kcal = 0, protein = 0, fat = 0, carbs = 0;

        if (entry.custom_kcal) {
            kcal = (entry.custom_kcal * amount / 100).toFixed(1);
        }
        if (entry.custom_protein) {
            protein = (entry.custom_protein * amount / 100).toFixed(1);
        }
        if (entry.custom_fat) {
            fat = (entry.custom_fat * amount / 100).toFixed(1);
        }
        if (entry.custom_carbs) {
            carbs = (entry.custom_carbs * amount / 100).toFixed(1);
        }

        totalKcal += parseFloat(kcal);
        totalProtein += parseFloat(protein);
        totalFat += parseFloat(fat);
        totalCarbs += parseFloat(carbs);
    });

    // Если нет записей, но есть типы приемов пищи, показываем их все
    if (entries.length === 0 && mealTypesList.length > 0) {
        summaryEl.style.display = 'none';
        container.innerHTML = '';
        mealTypesList.forEach(mealType => {
            const mealSection = document.createElement('div');
            mealSection.className = 'meal-section';
            const mealHeader = document.createElement('div');
            mealHeader.className = 'meal-header';
            mealHeader.innerHTML = `<div class="meal-title">${mealType.name}</div>`;
            mealSection.appendChild(mealHeader);
            const mealEntries = document.createElement('div');
            mealEntries.className = 'meal-entries';
            mealEntries.innerHTML = '<div class="no-entries" style="padding: 20px; text-align: center; color: #7f8c8d;">Нет записей</div>';
            mealSection.appendChild(mealEntries);
            container.appendChild(mealSection);
        });
        return;
    }

    if (entries.length === 0) {
        container.innerHTML = '<div class="no-entries">Нет записей за выбранную дату</div>';
        summaryEl.style.display = 'none';
        return;
    }

    // Обновляем итоги
    document.getElementById('total-kcal').textContent = Math.round(totalKcal);
    document.getElementById('total-protein').textContent = totalProtein.toFixed(1) + ' г';
    document.getElementById('total-fat').textContent = totalFat.toFixed(1) + ' г';
    document.getElementById('total-carbs').textContent = totalCarbs.toFixed(1) + ' г';
    summaryEl.style.display = 'block';

    // Отображаем записи - показываем все типы приемов пищи
    container.innerHTML = '';
    
    // Создаем массив всех типов приемов пищи с записями
    const allMealTypes = mealTypesList.length > 0 ? mealTypesList : 
        Object.keys(grouped).map(name => ({ name, id: null }));
    
    allMealTypes.forEach(mealType => {
        const mealSection = document.createElement('div');
        mealSection.className = 'meal-section';

        const mealHeader = document.createElement('div');
        mealHeader.className = 'meal-header';
        mealHeader.innerHTML = `<div class="meal-title">${mealType.name}</div>`;
        mealSection.appendChild(mealHeader);

        const mealEntries = document.createElement('div');
        mealEntries.className = 'meal-entries';

        const entriesForMeal = grouped[mealType.name] || [];
        
        if (entriesForMeal.length === 0) {
            mealEntries.innerHTML = '<div class="no-entries" style="padding: 20px; text-align: center; color: #7f8c8d;">Нет записей</div>';
        } else {
            entriesForMeal.forEach(entry => {
                const entryCard = document.createElement('div');
                entryCard.className = 'entry-card';

                const entryHeader = document.createElement('div');
                entryHeader.className = 'entry-header';
                
                const entryName = document.createElement('div');
                entryName.className = 'entry-name';
                entryName.textContent = entry.custom_name || 'Неизвестный продукт';
                
                const entryAmount = document.createElement('div');
                entryAmount.className = 'entry-amount';
                entryAmount.textContent = `${entry.amount_gram} г`;

                entryHeader.appendChild(entryName);
                entryHeader.appendChild(entryAmount);
                entryCard.appendChild(entryHeader);

                // Нутриенты - используем только custom поля
                const amount = parseFloat(entry.amount_gram);
                let kcal = '0', protein = '0', fat = '0', carbs = '0';

                if (entry.custom_kcal) {
                    kcal = (entry.custom_kcal * amount / 100).toFixed(1);
                }
                if (entry.custom_protein) {
                    protein = (entry.custom_protein * amount / 100).toFixed(1);
                }
                if (entry.custom_fat) {
                    fat = (entry.custom_fat * amount / 100).toFixed(1);
                }
                if (entry.custom_carbs) {
                    carbs = (entry.custom_carbs * amount / 100).toFixed(1);
                }

                const nutrients = document.createElement('div');
                nutrients.className = 'entry-nutrients';
                nutrients.innerHTML = `
                    <div class="nutrient-item">
                        <div class="nutrient-label">Калории</div>
                        <div class="nutrient-value kcal">${kcal} ккал</div>
                    </div>
                    <div class="nutrient-item">
                        <div class="nutrient-label">Белки</div>
                        <div class="nutrient-value protein">${protein} г</div>
                    </div>
                    <div class="nutrient-item">
                        <div class="nutrient-label">Жиры</div>
                        <div class="nutrient-value fat">${fat} г</div>
                    </div>
                    <div class="nutrient-item">
                        <div class="nutrient-label">Углеводы</div>
                        <div class="nutrient-value carbs">${carbs} г</div>
                    </div>
                `;
                entryCard.appendChild(nutrients);
                mealEntries.appendChild(entryCard);
            });
        }

        mealSection.appendChild(mealEntries);
        container.appendChild(mealSection);
    });
}

// Загружаем типы приемов пищи при загрузке страницы
loadMealTypes().then(() => {
    loadDiary();
});