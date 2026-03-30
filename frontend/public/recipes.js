document.addEventListener('DOMContentLoaded', async function() {
    const loadingEl = document.getElementById('loading');
    const contentEl = document.getElementById('recipes-content');
    const recipeModal = document.getElementById('recipe-modal');
    const closeModalBtn = document.getElementById('close-recipe-modal');

    const categoryMap = {
        'завтрак': 'breakfast',
        'breakfast': 'breakfast',
        'обед': 'lunch',
        'lunch': 'lunch',
        'ужин': 'dinner',
        'dinner': 'dinner',
        'десерт': 'dessert',
        'dessert': 'dessert'
    };

    const gridIds = {
        breakfast: 'breakfast-grid',
        lunch: 'lunch-grid',
        dinner: 'dinner-grid',
        dessert: 'dessert-grid'
    };

    function normalizeCategory(cat) {
        if (!cat) return null;
        const key = String(cat).toLowerCase().trim();
        return categoryMap[key] || null;
    }

    function getImageSrc(imageUrl) {
        if (!imageUrl) return null;
        const path = String(imageUrl).trim();
        return path.startsWith('/') ? path : '/' + path;
    }

    function renderRecipeCard(recipe) {
        const imgSrc = getImageSrc(recipe.image_url);
        const card = document.createElement('div');
        card.className = 'recipe-card';
        const imgWrap = document.createElement('div');
        imgWrap.className = 'recipe-image-wrap';
        if (imgSrc) {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = recipe.name || '';
            img.onerror = function() {
                const span = document.createElement('span');
                span.className = 'recipe-placeholder';
                span.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
                span.textContent = 'Нет фото';
                imgWrap.innerHTML = '';
                imgWrap.appendChild(span);
            };
            imgWrap.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'recipe-placeholder';
            span.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
            span.textContent = 'Нет фото';
            imgWrap.appendChild(span);
        }
        imgWrap.addEventListener('click', () => openRecipeModal(recipe));

        const nameEl = document.createElement('div');
        nameEl.className = 'recipe-name';
        nameEl.textContent = recipe.name || 'Без названия';

        card.appendChild(imgWrap);
        card.appendChild(nameEl);
        return card;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function openRecipeModal(recipe) {
        document.getElementById('modal-recipe-name').textContent = recipe.name || 'Без названия';
        
        const imgEl = document.getElementById('modal-recipe-image');
        const imgSrc = getImageSrc(recipe.image_url);
        if (imgSrc) {
            imgEl.src = imgSrc;
            imgEl.style.display = 'block';
        } else {
            imgEl.style.display = 'none';
        }
    
        document.getElementById('modal-recipe-ingredients').textContent = recipe.ingredients || '—';
    
        // ─── ИНСТРУКЦИИ ───
        const instructionsEl = document.getElementById('modal-recipe-instructions');
        instructionsEl.innerHTML = ''; // очищаем предыдущее содержимое
    
        if (recipe.instructions) {
            const lines = recipe.instructions
                .replace(/\\n/g, '\n')
                .split('\n')
                .filter(line => line.trim() !== '');
            lines.forEach(line => {
                const p = document.createElement('p');
                p.textContent = line.trim();
                // p.style.marginBottom = '8px';  // лучше вынести в CSS
                instructionsEl.appendChild(p);
            });
        } else {
            instructionsEl.textContent = '—';
        }
        // ───────────────────
    
        document.getElementById('modal-recipe-kcal').textContent = 
            recipe.kcal_per_100 != null ? recipe.kcal_per_100 + ' ккал' : '—';
        
        document.getElementById('modal-recipe-protein').textContent = 
            recipe.protein_g != null ? recipe.protein_g + ' г' : '—';
        
        document.getElementById('modal-recipe-fat').textContent = 
            recipe.fat_g != null ? recipe.fat_g + ' г' : '—';
        
        document.getElementById('modal-recipe-carbs').textContent = 
            recipe.carbs_g != null ? recipe.carbs_g + ' г' : '—';
        
        document.getElementById('modal-recipe-time').textContent = 
            recipe.time_minutes != null ? recipe.time_minutes + ' мин' : '—';
        
        document.getElementById('modal-recipe-servings').textContent = 
            recipe.servings != null ? recipe.servings + ' порц.' : '—';
    
        recipeModal.classList.add('show');
    }

    closeModalBtn.addEventListener('click', () => recipeModal.classList.remove('show'));
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) recipeModal.classList.remove('show');
    });

    try {
        const response = await fetch('/api/recipes');
        if (!response.ok) throw new Error('Ошибка загрузки');

        const recipes = await response.json();
        const byCategory = { breakfast: [], lunch: [], dinner: [], dessert: [] };

        recipes.forEach(r => {
            const cat = normalizeCategory(r.category);
            if (cat && byCategory[cat]) {
                byCategory[cat].push(r);
            }
        });

        ['breakfast', 'lunch', 'dinner', 'dessert'].forEach(cat => {
            const grid = document.getElementById(gridIds[cat]);
            const items = byCategory[cat].slice(0, 3);
            grid.innerHTML = '';
            items.forEach(recipe => grid.appendChild(renderRecipeCard(recipe)));
        });

        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
    } catch (err) {
        console.error(err);
        loadingEl.innerHTML = 'Ошибка загрузки рецептов. Убедитесь, что таблица recipes создана в БД.';
    }
});
