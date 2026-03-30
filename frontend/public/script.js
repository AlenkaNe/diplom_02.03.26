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

    // Загружаем продукты из дневника при загрузке страницы
    loadDiaryProducts();

    // Блок "Ваши блюда и продукты"
    const createRecipeBtn = document.getElementById('create-recipe-btn');
    const viewRecipesBtn = document.getElementById('view-recipes-btn');
    const createRecipeModal = document.getElementById('create-recipe-modal');
    const viewRecipesModal = document.getElementById('view-recipes-modal');
    const closeCreateRecipeModal = document.getElementById('close-create-recipe-modal');
    const closeViewRecipesModal = document.getElementById('close-view-recipes-modal');
    const createRecipeForm = document.getElementById('create-recipe-form');

    createRecipeBtn.addEventListener('click', () => {
        createRecipeForm.reset();
        document.getElementById('create-recipe-message').style.display = 'none';
        createRecipeModal.classList.add('show');
    });
    closeCreateRecipeModal.addEventListener('click', () => createRecipeModal.classList.remove('show'));
    createRecipeModal.addEventListener('click', (e) => {
        if (e.target === createRecipeModal) createRecipeModal.classList.remove('show');
    });

    viewRecipesBtn.addEventListener('click', async () => {
        await loadAndShowRecipes();
        viewRecipesModal.classList.add('show');
    });
    closeViewRecipesModal.addEventListener('click', () => viewRecipesModal.classList.remove('show'));
    viewRecipesModal.addEventListener('click', (e) => {
        if (e.target === viewRecipesModal) viewRecipesModal.classList.remove('show');
    });

    createRecipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('create-recipe-message');
        const name = document.getElementById('recipe-name').value.trim();
        const kcal = document.getElementById('recipe-kcal').value;
        const protein = document.getElementById('recipe-protein').value;
        const fat = document.getElementById('recipe-fat').value;
        const carbs = document.getElementById('recipe-carbs').value;

        try {
            const response = await fetch('/api/user-recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name,
                    kcal_per_100: kcal ? parseFloat(kcal) : null,
                    protein_g: protein ? parseFloat(protein) : null,
                    fat_g: fat ? parseFloat(fat) : null,
                    carbs_g: carbs ? parseFloat(carbs) : null
                })
            });
            const data = await response.json();

            if (response.ok) {
                msgEl.textContent = 'Блюдо успешно создано!';
                msgEl.className = 'message success';
                msgEl.style.display = 'block';
                setTimeout(() => {
                    createRecipeModal.classList.remove('show');
                }, 1200);
            } else {
                msgEl.textContent = data.error || 'Ошибка создания блюда';
                msgEl.className = 'message error';
                msgEl.style.display = 'block';
            }
        } catch (err) {
            console.error(err);
            msgEl.textContent = 'Ошибка соединения: ' + err.message;
            msgEl.className = 'message error';
            msgEl.style.display = 'block';
        }
    });

    async function loadAndShowRecipes() {
        const listEl = document.getElementById('view-recipes-list');
        const emptyEl = document.getElementById('view-recipes-empty');

        try {
            const response = await fetch('/api/user-recipes', { credentials: 'include' });
            if (response.status === 401) {
                listEl.innerHTML = '<p class="diary-products-empty">Войдите в систему, чтобы просматривать блюда</p>';
                emptyEl.style.display = 'none';
                return;
            }
            if (!response.ok) throw new Error('Ошибка загрузки');

            const recipes = await response.json();
            if (recipes.length === 0) {
                listEl.innerHTML = '';
                emptyEl.style.display = 'block';
                return;
            }

            emptyEl.style.display = 'none';
            listEl.innerHTML = recipes.map(recipe => {
                const kcal = recipe.kcal_per_100 != null ? recipe.kcal_per_100 : '—';
                const protein = recipe.protein_g != null ? recipe.protein_g : '—';
                const fat = recipe.fat_g != null ? recipe.fat_g : '—';
                const carbs = recipe.carbs_g != null ? recipe.carbs_g : '—';
                return `
                    <div class="diary-product-card">
                        <div class="diary-product-header">
                            <div class="diary-product-name">${escapeHtml(recipe.name || 'Без названия')}</div>
                        </div>
                        <div class="diary-product-per-100">на 100 г продукта</div>
                        <div class="diary-product-nutrients">
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Калории</div>
                                <div class="diary-product-nutrient-value kcal">${kcal}${recipe.kcal_per_100 != null ? ' ккал' : ''}</div>
                            </div>
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Белки</div>
                                <div class="diary-product-nutrient-value protein">${protein}${recipe.protein_g != null ? ' г' : ''}</div>
                            </div>
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Жиры</div>
                                <div class="diary-product-nutrient-value fat">${fat}${recipe.fat_g != null ? ' г' : ''}</div>
                            </div>
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Углеводы</div>
                                <div class="diary-product-nutrient-value carbs">${carbs}${recipe.carbs_g != null ? ' г' : ''}</div>
                            </div>
                        </div>
                        <button type="button" class="diary-product-add-btn add-recipe-to-diary-btn">Добавить в дневник питания</button>
                    </div>
                `;
            }).join('');

            listEl.querySelectorAll('.add-recipe-to-diary-btn').forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    const recipe = recipes[index];
                    const recipeForDiary = {
                        custom_name: recipe.name,
                        custom_kcal: recipe.kcal_per_100,
                        custom_protein: recipe.protein_g,
                        custom_fat: recipe.fat_g,
                        custom_carbs: recipe.carbs_g
                    };
                    viewRecipesModal.classList.remove('show');
                    showAddToDiaryModal(recipeForDiary);
                });
            });
        } catch (err) {
            console.error('Ошибка загрузки блюд:', err);
            listEl.innerHTML = '<p class="diary-products-empty">Ошибка загрузки блюд</p>';
            emptyEl.style.display = 'none';
        }
    }
    
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

    async function loadDiaryProducts() {
        const blockEl = document.getElementById('diary-products-block');
        const containerEl = document.getElementById('diary-products-container');
        if (!blockEl || !containerEl) return;

        try {
            const response = await fetch('/api/diary-products', { credentials: 'include' });
            if (response.status === 401 || response.status === 404) {
                blockEl.style.display = 'none';
                return;
            }
            if (!response.ok) throw new Error('Ошибка загрузки');

            const products = await response.json();
            if (products.length === 0) {
                blockEl.style.display = 'block';
                containerEl.innerHTML = '<div class="diary-products-empty">Вы еще не добавляли продукты в дневник питания</div>';
                return;
            }

            blockEl.style.display = 'block';
            window._diaryProductsCache = products;
            containerEl.innerHTML = products.map((product, index) => {
                const kcal = product.custom_kcal != null ? product.custom_kcal : '—';
                const protein = product.custom_protein != null ? product.custom_protein : '—';
                const fat = product.custom_fat != null ? product.custom_fat : '—';
                const carbs = product.custom_carbs != null ? product.custom_carbs : '—';
                return `
                    <div class="diary-product-card">
                        <div class="diary-product-header">
                            <div class="diary-product-name">${escapeHtml(product.custom_name || 'Неизвестный продукт')}</div>
                        </div>
                        <div class="diary-product-per-100">на 100 г продукта</div>
                        <div class="diary-product-nutrients">
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Калории</div>
                                <div class="diary-product-nutrient-value kcal">${kcal}${product.custom_kcal != null ? ' ккал' : ''}</div>
                            </div>
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Белки</div>
                                <div class="diary-product-nutrient-value protein">${protein}${product.custom_protein != null ? ' г' : ''}</div>
                            </div>
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Жиры</div>
                                <div class="diary-product-nutrient-value fat">${fat}${product.custom_fat != null ? ' г' : ''}</div>
                            </div>
                            <div class="diary-product-nutrient-item">
                                <div class="diary-product-nutrient-label">Углеводы</div>
                                <div class="diary-product-nutrient-value carbs">${carbs}${product.custom_carbs != null ? ' г' : ''}</div>
                            </div>
                        </div>
                        <button type="button" class="diary-product-add-btn" data-diary-index="${index}">Добавить в дневник питания</button>
                    </div>
                `;
            }).join('');

            containerEl.querySelectorAll('.diary-product-add-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-diary-index'), 10);
                    const product = window._diaryProductsCache && window._diaryProductsCache[index];
                    if (product) showAddToDiaryModal(product);
                });
            });
        } catch (error) {
            console.error('Ошибка загрузки продуктов из дневника:', error);
            blockEl.style.display = 'none';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    async function showAddToDiaryModal(foodOrDiaryProduct) {
        currentFood = foodOrDiaryProduct;
        await loadMealTypes();
        const nameEl = document.getElementById('add-to-diary-product-name');
        if (nameEl) {
            const name = foodOrDiaryProduct.custom_name || foodOrDiaryProduct.description || `Продукт ${foodOrDiaryProduct.id || ''}`;
            nameEl.textContent = name ? `«${name}»` : '';
            nameEl.style.display = name ? 'block' : 'none';
        }
        addToDiaryModal.classList.add('show');
    }

    function hideAddToDiaryModal() {
        addToDiaryModal.classList.remove('show');
        addToDiaryForm.reset();
        diaryMessage.style.display = 'none';
        const nameEl = document.getElementById('add-to-diary-product-name');
        if (nameEl) nameEl.style.display = 'none';
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

        let customName, customKcal, customProtein, customFat, customCarbs;

        if (currentFood.custom_name !== undefined) {
            // Продукт из дневника (блок "Продукты, которые вы уже искали")
            customName = currentFood.custom_name;
            customKcal = currentFood.custom_kcal ?? null;
            customProtein = currentFood.custom_protein ?? null;
            customFat = currentFood.custom_fat ?? null;
            customCarbs = currentFood.custom_carbs ?? null;
        } else {
            // Продукт из поиска (foods API)
            const nutrients = Array.isArray(currentFood.foodNutrients) ? currentFood.foodNutrients : [];
            const kcalNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('energy') || n.name.toLowerCase().includes('калори')));
            const proteinNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('protein') || n.name.toLowerCase().includes('белк')));
            const fatNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('fat') || n.name.toLowerCase().includes('жир')));
            const carbsNutrient = nutrients.find(n => n.name && (n.name.toLowerCase().includes('carbohydrate') || n.name.toLowerCase().includes('углевод')));
            customName = currentFood.description || `Продукт ${currentFood.id}`;
            customKcal = kcalNutrient ? kcalNutrient.amount : null;
            customProtein = proteinNutrient ? proteinNutrient.amount : null;
            customFat = fatNutrient ? fatNutrient.amount : null;
            customCarbs = carbsNutrient ? carbsNutrient.amount : null;
        }

        try {
            const response = await fetch('/api/diary/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    meal_type_id: parseInt(mealTypeId),
                    amount_gram: Math.round(parseFloat(amountGram)),
                    custom_name: customName,
                    custom_kcal: customKcal,
                    custom_protein: customProtein,
                    custom_fat: customFat,
                    custom_carbs: customCarbs
                })
            });

            const data = await response.json();

            if (response.ok) {
                showDiaryMessage('Продукт успешно добавлен в дневник!', 'success');
                loadDiaryProducts();
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