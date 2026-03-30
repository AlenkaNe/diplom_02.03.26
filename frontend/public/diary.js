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
        const [diaryResponse, meResponse] = await Promise.all([
            fetch(`/api/diary?date=${date}`, { credentials: 'include' }),
            fetch('/api/me', { credentials: 'include' })
        ]);

        if (diaryResponse.status === 401) {
            errorEl.textContent = 'Необходима авторизация. Пожалуйста, войдите в систему.';
            errorEl.style.display = 'block';
            loadingEl.style.display = 'none';
            displayUserDailyKcalNorm(null);
            return;
        }

        if (!diaryResponse.ok) {
            throw new Error('Ошибка загрузки данных');
        }

        const entries = await diaryResponse.json();
        const user = meResponse.ok ? await meResponse.json() : null;

        displayEntries(entries);
        displayUserDailyKcalNorm(user);
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
    } catch (error) {
        console.error('Ошибка:', error);
        errorEl.textContent = 'Ошибка загрузки данных: ' + error.message;
        errorEl.style.display = 'block';
        loadingEl.style.display = 'none';
        displayUserDailyKcalNorm(null);
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

function displayUserDailyKcalNorm(user) {
    const content = document.getElementById('user-daily-norm-block');
    if (!content) return;

    const hasNorm = user && (user.daily_kcal_norm != null || user.daily_protein != null || user.daily_fat != null || user.daily_carbs != null);

    if (hasNorm) {
        content.innerHTML = `
            <div class="daily-norm-title">Рекомендуемая суточная норма</div>
            <div class="daily-norm-grid">
                <div class="daily-norm-item">
                    <div class="nutrient-label">Калории</div>
                    <div class="nutrient-value kcal">${user.daily_kcal_norm != null ? user.daily_kcal_norm + ' ккал' : '—'}</div>
                </div>
                <div class="daily-norm-item">
                    <div class="nutrient-label">Белки</div>
                    <div class="nutrient-value protein">${user.daily_protein != null ? user.daily_protein + ' г' : '—'}</div>
                </div>
                <div class="daily-norm-item">
                    <div class="nutrient-label">Жиры</div>
                    <div class="nutrient-value fat">${user.daily_fat != null ? user.daily_fat + ' г' : '—'}</div>
                </div>
                <div class="daily-norm-item">
                    <div class="nutrient-label">Углеводы</div>
                    <div class="nutrient-value carbs">${user.daily_carbs != null ? user.daily_carbs + ' г' : '—'}</div>
                </div>
            </div>
        `;
        content.classList.remove('daily-norm-recommendation');
    } else {
        content.innerHTML = `
            <div class="daily-norm-recommendation-text">Рекомендация: посчитайте в калькуляторе калорий вашу индивидуальную норму КБЖУ для наглядного отслеживания питания</div>
        `;
        content.classList.add('daily-norm-recommendation');
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
        const amount = Math.round(parseFloat(entry.amount_gram));
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
                
                const headerRow = document.createElement('div');
                headerRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; width: 100%;';
                const leftPart = document.createElement('div');
                leftPart.style.cssText = 'display: flex; align-items: center; gap: 10px; flex-wrap: wrap;';
                const entryName = document.createElement('div');
                entryName.className = 'entry-name';
                entryName.textContent = entry.custom_name || 'Неизвестный продукт';

                const entryActions = document.createElement('div');
                entryActions.className = 'entry-actions';
                entryActions.style.marginTop = '0';
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'entry-btn entry-btn-edit';
                editBtn.textContent = 'Редактировать вес';
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'entry-btn entry-btn-delete';
                deleteBtn.textContent = 'Удалить';

                editBtn.addEventListener('click', () => showEditWeightModal(entry));
                deleteBtn.addEventListener('click', () => deleteEntry(entry));

                entryActions.appendChild(editBtn);
                entryActions.appendChild(deleteBtn);
                leftPart.appendChild(entryName);
                leftPart.appendChild(entryActions);

                const entryAmount = document.createElement('div');
                entryAmount.className = 'entry-amount';
                entryAmount.textContent = `${Math.round(parseFloat(entry.amount_gram))} г`;

                headerRow.appendChild(leftPart);
                headerRow.appendChild(entryAmount);
                entryHeader.appendChild(headerRow);

                entryCard.appendChild(entryHeader);

                // Нутриенты - используем только custom поля
                const amount = Math.round(parseFloat(entry.amount_gram));
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

// Модальное окно редактирования веса
let currentEditEntry = null;

const editWeightModal = document.getElementById('edit-weight-modal');
const editWeightForm = document.getElementById('edit-weight-form');
const editWeightInput = document.getElementById('edit-weight-input');
const editWeightMessage = document.getElementById('edit-weight-message');
const editWeightCancel = document.getElementById('edit-weight-cancel');
const editWeightPlus = document.getElementById('edit-weight-plus');
const editWeightMinus = document.getElementById('edit-weight-minus');

editWeightPlus.addEventListener('click', () => {
    const val = parseInt(editWeightInput.value, 10) || 0;
    editWeightInput.value = Math.max(1, val + 10);
});

editWeightMinus.addEventListener('click', () => {
    const val = parseInt(editWeightInput.value, 10) || 0;
    editWeightInput.value = Math.max(1, val - 10);
});

function showEditWeightModal(entry) {
    currentEditEntry = entry;
    editWeightInput.value = Math.round(parseFloat(entry.amount_gram));
    editWeightMessage.style.display = 'none';
    editWeightMessage.className = 'diary-modal-message';
    document.getElementById('edit-weight-modal-title').textContent = `Редактировать вес: ${entry.custom_name || 'Продукт'}`;
    editWeightModal.classList.add('show');
    editWeightInput.focus();
}

function hideEditWeightModal() {
    editWeightModal.classList.remove('show');
    currentEditEntry = null;
    editWeightForm.reset();
}

editWeightCancel.addEventListener('click', hideEditWeightModal);
editWeightModal.addEventListener('click', (e) => {
    if (e.target === editWeightModal) hideEditWeightModal();
});

editWeightForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditEntry) return;

    const newAmount = Math.round(parseFloat(editWeightInput.value));
    if (!newAmount || newAmount <= 0) {
        editWeightMessage.textContent = 'Введите корректный вес';
        editWeightMessage.className = 'diary-modal-message error';
        editWeightMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`/api/diary/${currentEditEntry.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount_gram: Math.round(newAmount) })
        });

        const data = await response.json();

        if (response.ok) {
            editWeightMessage.textContent = 'Вес обновлён, КБЖУ пересчитаны';
            editWeightMessage.className = 'diary-modal-message success';
            editWeightMessage.style.display = 'block';
            setTimeout(() => {
                hideEditWeightModal();
                loadDiary();
            }, 800);
        } else {
            editWeightMessage.textContent = data.error || 'Ошибка обновления';
            editWeightMessage.className = 'diary-modal-message error';
            editWeightMessage.style.display = 'block';
        }
    } catch (err) {
        console.error('Ошибка:', err);
        editWeightMessage.textContent = 'Ошибка соединения: ' + err.message;
        editWeightMessage.className = 'diary-modal-message error';
        editWeightMessage.style.display = 'block';
    }
});

async function deleteEntry(entry) {
    if (!confirm(`Удалить "${entry.custom_name || 'продукт'}" из дневника?`)) return;

    try {
        const response = await fetch(`/api/diary/${entry.id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            loadDiary();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка удаления');
        }
    } catch (err) {
        console.error('Ошибка:', err);
        alert('Ошибка соединения: ' + err.message);
    }
}

// Загружаем типы приемов пищи при загрузке страницы
loadMealTypes().then(() => {
    loadDiary();
});