document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const resultsBody = document.getElementById('results-body');
    const noResults = document.getElementById('no-results');
    const loader = document.getElementById('loader');
    const resultsTable = document.getElementById('results-table');
    const nutrientModal = document.getElementById('nutrient-modal');
    const nutrientTitle = document.getElementById('nutrient-title');
    const nutrientBody = document.getElementById('nutrient-body');
    const closeModalBtn = document.getElementById('close-modal');
    
    // Скрываем таблицу при загрузке страницы
    resultsTable.style.display = 'none';
    noResults.style.display = 'none';
    
    // Обработчик события для кнопки поиска
    searchButton.addEventListener('click', performSearch);
    closeModalBtn.addEventListener('click', hideModal);
    nutrientModal.addEventListener('click', (e) => {
        if (e.target === nutrientModal) {
            hideModal();
        }
    });
    
    // Обработчик события для Enter в поле ввода
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Функция поиска
    function performSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            alert('Пожалуйста, введите текст для поиска');
            return;
        }
        
        // Показываем индикатор загрузки
        loader.style.display = 'block';
        resultsTable.style.display = 'none';
        noResults.style.display = 'none';
        
        // Формируем URL с параметрами
        const url = `/foods/search?query=${encodeURIComponent(query)}&pageSize=20&pageNumber=1`;
        
        // Отправляем GET-запрос на API
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка сети или сервера');
                }
                return response.json();
            })
            .then(data => {
                displayResults(data);
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при поиске. Попробуйте позже.');
            })
            .finally(() => {
                // Скрываем индикатор загрузки
                loader.style.display = 'none';
            });
    }
    
    // Функция отображения результатов
    function displayResults(foods) {
        // Очищаем предыдущие результаты
        resultsBody.innerHTML = '';
        
        if (foods && foods.length > 0) {
            // Показываем таблицу
            resultsTable.style.display = 'table';
            noResults.style.display = 'none';
            
            // Заполняем таблицу данными
            foods.forEach(food => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${food.id}</td>
                    <td>${food.description || '-'}</td>
                    <td>${food.brandName || '-'}</td>
                    <td>${food.ingredients || '-'}</td>
                    <td>${food.servingSize ? food.servingSize + ' ' + (food.servingSizeUnit || '') : '-'}</td>
                    <td><button class="details-btn" type="button">Подробнее</button></td>
                    <td><button class="add-to-diary-btn" type="button" data-food-id="${food.id}">Добавить в дневник</button></td>
                `;
                const detailsButton = row.querySelector('.details-btn');
                detailsButton.addEventListener('click', () => showNutrients(food));
                
                const addToDiaryButton = row.querySelector('.add-to-diary-btn');
                addToDiaryButton.addEventListener('click', () => showAddToDiaryModal(food));
                
                resultsBody.appendChild(row);
            });
        } else {
            // Если результатов нет
            resultsTable.style.display = 'none';
            noResults.style.display = 'block';
        }
    }

    function showNutrients(food) {
        nutrientTitle.textContent = food.description || `Продукт ${food.id}`;
        const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
        nutrientBody.innerHTML = '';

        if (nutrients.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'no-nutrients';
            empty.textContent = 'Данные о нутриентах отсутствуют';
            nutrientBody.appendChild(empty);
        } else {
            const table = document.createElement('table');
            table.className = 'nutrient-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Нутриент</th>
                        <th>Количество</th>
                        <th>Ед. изм.</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            const tbody = table.querySelector('tbody');
            nutrients.forEach(nutrient => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${nutrient.name || '-'}</td>
                    <td>${nutrient.amount ?? '-'}</td>
                    <td>${nutrient.unitName || '-'}</td>
                `;
                tbody.appendChild(tr);
            });

            nutrientBody.appendChild(table);
        }

        nutrientModal.classList.add('show');
    }

    function hideModal() {
        nutrientModal.classList.remove('show');
    }

    // Функции для добавления продукта в дневник
    const addToDiaryModal = document.getElementById('add-to-diary-modal');
    const closeDiaryModalBtn = document.getElementById('close-diary-modal');
    const mealTypeSelect = document.getElementById('meal-type-select');
    const addToDiaryForm = document.getElementById('add-to-diary-form');
    const diaryMessage = document.getElementById('diary-message');
    let currentFood = null;

    closeDiaryModalBtn.addEventListener('click', hideAddToDiaryModal);
    addToDiaryModal.addEventListener('click', (e) => {
        if (e.target === addToDiaryModal) {
            hideAddToDiaryModal();
        }
    });

    addToDiaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addFoodToDiary();
    });

    async function loadMealTypes() {
        try {
            const response = await fetch('/api/meal-types', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Ошибка загрузки типов приемов пищи');
            }
            const mealTypes = await response.json();
            mealTypeSelect.innerHTML = '<option value="">Выберите тип приема пищи</option>';
            mealTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                mealTypeSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Ошибка загрузки типов приемов пищи:', error);
            showDiaryMessage('Ошибка загрузки типов приемов пищи', 'error');
        }
    }

    async function showAddToDiaryModal(food) {
        currentFood = food;
        await loadMealTypes();
        addToDiaryModal.classList.add('show');
    }

    function hideAddToDiaryModal() {
        addToDiaryModal.classList.remove('show');
        addToDiaryForm.reset();
        diaryMessage.style.display = 'none';
        currentFood = null;
    }

    function showDiaryMessage(text, type) {
        diaryMessage.textContent = text;
        diaryMessage.className = `message ${type}`;
        diaryMessage.style.display = 'block';
    }

    async function addFoodToDiary() {
        const mealTypeId = mealTypeSelect.value;
        const amountGram = document.getElementById('amount-gram').value;

        if (!mealTypeId || !amountGram) {
            showDiaryMessage('Заполните все поля', 'error');
            return;
        }

        // Получаем данные о нутриентах из продукта
        const nutrients = Array.isArray(currentFood.foodNutrients) ? currentFood.foodNutrients : [];
        const kcalNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('energy') || n.name.toLowerCase().includes('калори')));
        const proteinNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('protein') || n.name.toLowerCase().includes('белк')));
        const fatNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('fat') || n.name.toLowerCase().includes('жир')));
        const carbsNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('carbohydrate') || n.name.toLowerCase().includes('углевод')));

        const customKcal = kcalNutrient ? kcalNutrient.amount : null;
        const customProtein = proteinNutrient ? proteinNutrient.amount : null;
        const customFat = fatNutrient ? fatNutrient.amount : null;
        const customCarbs = carbsNutrient ? carbsNutrient.amount : null;

        try {
            const response = await fetch('/api/diary/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    meal_type_id: parseInt(mealTypeId),
                    amount_gram: parseFloat(amountGram),
                    custom_name: currentFood.description || `Продукт ${currentFood.id}`,
                    custom_kcal: customKcal,
                    custom_protein: customProtein,
                    custom_fat: customFat,
                    custom_carbs: customCarbs
                })
            });

            const data = await response.json();

            if (response.ok) {
                showDiaryMessage('Продукт успешно добавлен в дневник!', 'success');
                setTimeout(() => {
                    hideAddToDiaryModal();
                }, 1500);
            } else {
                if (response.status === 401) {
                    showDiaryMessage('Необходима авторизация. Пожалуйста, войдите в систему.', 'error');
                } else {
                    showDiaryMessage(data.error || 'Ошибка добавления продукта', 'error');
                }
            }
        } catch (error) {
            console.error('Ошибка добавления продукта:', error);
            showDiaryMessage('Ошибка соединения: ' + error.message, 'error');
        }
    }
});

/*
Строка 1: document.addEventListener('DOMContentLoaded', function() {
Ожидает полной загрузки DOM перед выполнением кода.
Строки 2-7: Получение ссылок на элементы DOM:
2: searchInput — поле ввода поиска
3: searchButton — кнопка поиска
4: resultsBody — тело таблицы результатов
5: noResults — сообщение "нет результатов"
6: loader — индикатор загрузки
7: resultsTable — таблица результатов
Строки 9-11: Инициализация:
10: Скрывает таблицу результатов
11: Скрывает сообщение "нет результатов"
Строка 14: searchButton.addEventListener('click', performSearch);
При клике на кнопку вызывает performSearch().
Строки 17-21: Обработка Enter в поле ввода:
17: Слушает нажатия клавиш
18: Проверяет, что нажата Enter
19: Вызывает performSearch()
Строки 24-59: Функция performSearch():
25: Получает и обрезает значение из поля ввода
27-30: Проверяет, что запрос не пустой; иначе показывает alert
33: Показывает индикатор загрузки
34-35: Скрывает таблицу и сообщение "нет результатов"
38: Формирует URL с параметрами поиска (кодирует запрос)
41: Отправляет GET-запрос через fetch()
42-46: Обрабатывает ответ: проверяет статус и парсит JSON
48-50: При успехе вызывает displayResults()
51-54: При ошибке логирует в консоль и показывает alert
55-58: В finally скрывает индикатор загрузки
Строки 62-90: Функция displayResults(foods):
64: Очищает предыдущие результаты
66: Проверяет, есть ли результаты
68: Показывает таблицу
69: Скрывает сообщение "нет результатов"
72-84: Для каждого продукта:
73: Создает строку таблицы (<tr>)
75-81: Заполняет ячейки: ID, описание, бренд, ингредиенты, размер порции
83: Добавляет строку в таблицу
85-89: Если результатов нет:
87: Скрывает таблицу
88: Показывает сообщение "нет результатов"
Строка 91: });
Закрывает обработчик DOMContentLoaded.
Итог: скрипт реализует поиск продуктов с отображением результатов в таблице, обработкой ошибок и индикатором загрузки.
*/