// Telegram Web App API
let tg = window.Telegram.WebApp;

// Конфигурация
const CONFIG = {
    API_BASE_URL: 'https://restocorp.ru/api', // API через nginx на домене
    WEBSOCKET_URL: 'ws://localhost:8000/ws'
};

// Состояние приложения
const AppState = {
    currentScreen: 'main-menu',
    user: null,
    profile: {
        role: '',
        specialization: ''
    },
    history: [],
    questions: [],
    allQuestions: [], // Все вопросы без фильтрации
    questionCategories: [], // Категории вопросов
    questionFilters: {
        search: '',
        category: ''
    }
};

// Глобальные переменные для ролей и специализаций
let roles = [];
let specializations = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация мини-приложения...');
    console.log('🌐 CONFIG:', CONFIG);
    console.log('📱 Telegram WebApp объект:', window.Telegram?.WebApp);
    
    // ОТЛАДКА: Проверяем данные пользователя
    console.log('🔍 ОТЛАДКА: Данные пользователя Telegram:');
    console.log('- tg.initDataUnsafe:', tg?.initDataUnsafe);
    console.log('- tg.initDataUnsafe.user:', tg?.initDataUnsafe?.user);
    if (tg?.initDataUnsafe?.user) {
        console.log('- User ID:', tg.initDataUnsafe.user.id);
        console.log('- Username:', tg.initDataUnsafe.user.username);
        console.log('- First name:', tg.initDataUnsafe.user.first_name);
        console.log('- Last name:', tg.initDataUnsafe.user.last_name);
    }
    
    try {
        console.log('🔧 Инициализируем viewport fixes...');
        initViewportFixes();
        
        console.log('📱 Инициализируем Telegram WebApp...');
        initTelegramWebApp();
        
        console.log('📋 Загружаем роли и специализации...');
        await loadRolesAndSpecializations();
        
        console.log('👤 Загружаем профиль пользователя...');
        await loadUserProfile();
        
        console.log('📚 Загружаем историю...');
        await loadHistory();
        
        console.log('❓ Загружаем вопросы...');
        await loadQuestions();
        
        console.log('🏠 Создаем главное меню...');
        createMainMenu();
        
        console.log('✅ Инициализация завершена успешно!');
        console.log('📊 Финальное состояние AppState:', {
            user: AppState.user,
            profile: AppState.profile,
            questionsCount: AppState.questions?.length || 0,
            historyCount: AppState.history?.length || 0
        });
        
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА инициализации:', error);
        console.error('📋 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        
        // Показываем ошибку пользователю
        showAlert('Ошибка инициализации приложения');
    }
});

// Исправления для viewport на разных устройствах
function initViewportFixes() {
    function setVhProperty() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVhProperty();
    
    window.addEventListener('resize', debounce(setVhProperty, 100));
    window.addEventListener('orientationchange', () => {
        setTimeout(setVhProperty, 100);
    });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Инициализация Telegram WebApp
function initTelegramWebApp() {
    try {
        tg.expand();
        
        // Используем новые возможности Telegram UI Kit 6.10+
        if (tg.setHeaderColor) {
            // Устанавливаем цвет заголовка в соответствии с темой
        tg.setHeaderColor('bg_color');
        }
        
        // Применяем цвета заголовка если доступны
        if (tg.headerColor) {
            document.documentElement.style.setProperty('--tg-header-color', tg.headerColor);
        }
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            AppState.user = tg.initDataUnsafe.user;
            console.log('Пользователь Telegram:', AppState.user);
            // Сохраняем user_id для последующего использования
            saveUserId(AppState.user.id);
        } else {
            // Если нет данных пользователя, попробуем получить их из других источников
            console.warn('Данные пользователя Telegram недоступны');
            // Можно добавить дополнительную логику для получения ID пользователя
        }
        
        tg.MainButton.text = 'Готово';
        tg.MainButton.hide();
        
        tg.BackButton.onClick(() => {
            goBack();
        });
        
        // Обработка изменений темы
        if (tg.onEvent) {
            tg.onEvent('themeChanged', () => {
                console.log('Тема изменена, обновляем стили');
                updateThemeColors();
            });
        }
        
        console.log('Telegram Web App инициализирован');
    } catch (error) {
        console.error('Ошибка инициализации Telegram Web App:', error);
    }
}

// Функция обновления цветов темы
function updateThemeColors() {
    // Обновляем CSS переменные при изменении темы
    const root = document.documentElement;
    
    // Применяем новые цвета заголовка если доступны
    if (tg.headerColor) {
        root.style.setProperty('--tg-header-color', tg.headerColor);
    }
    
    // Принудительно обновляем стили
    document.body.style.backgroundColor = 'var(--tg-theme-bg-color)';
    document.body.style.color = 'var(--tg-theme-text-color)';
}

// Инициализация Telegram UI Kit
function initTelegramUI() {
    if (!TelegramUI) {
        console.error('Telegram UI Kit не загружен');
        return;
    }

    // Создаем главное меню
    createMainMenu();
    
    console.log('Telegram UI Kit инициализирован');
}

// Создание главного меню с Telegram UI компонентами
function createMainMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const menuItems = [
        {
            id: 'ask-question',
            icon: '❓',
            title: 'Задать вопрос',
            description: 'Получите персонализированный ответ от AI-ментора'
        },
        {
            id: 'questions-library',
            icon: '📚',
            title: 'Библиотека вопросов',
            description: 'Готовые вопросы по ролям и специализациям'
        },
        {
            id: 'history',
            icon: '📜',
            title: 'История диалогов',
            description: 'Просмотрите предыдущие беседы'
        },
        {
            id: 'profile',
            icon: '👤',
            title: 'Профиль',
            description: 'Настройте роль и специализацию'
        },
        {
            id: 'feedback',
            icon: '💬',
            title: 'Обратная связь',
            description: 'Поделитесь предложениями по улучшению'
        }
    ];

    menuGrid.innerHTML = '';

    menuItems.forEach(item => {
        const card = createMenuCard(item);
        menuGrid.appendChild(card);
    });
}

// Создание карточки меню с использованием Telegram UI
function createMenuCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.onclick = () => showScreen(item.id);
    
    // Используем стили Telegram UI
    card.style.cssText = `
        background: var(--tg-theme-secondary-bg-color, #f0f0f0);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--tg-theme-section-separator-color, #e0e0e0);
    `;

    card.innerHTML = `
        <div class="menu-icon">${item.icon}</div>
        <h3 style="color: var(--tg-theme-text-color); font-size: 16px; font-weight: 600; margin-bottom: 4px;">
            ${item.title}
        </h3>
        <p style="color: var(--tg-theme-subtitle-text-color, var(--tg-theme-hint-color)); font-size: 14px; line-height: 1.3;">
            ${item.description}
        </p>
    `;

    return card;
}

// Создание заголовка экрана с кнопкой назад
function createScreenHeader(title, showBackButton = true) {
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: ${showBackButton ? 'flex-start' : 'center'};
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--tg-theme-section-separator-color, #e0e0e0);
        position: relative;
    `;

    if (showBackButton) {
        const backButton = document.createElement('button');
        backButton.innerHTML = 'Назад';
        backButton.style.cssText = `
            background: var(--tg-theme-bg-color);
            border: none;
            border-radius: 12px;
            padding: 8px 16px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--tg-theme-button-color);
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            white-space: nowrap;
        `;
        
        // Создаем ripple эффект
        backButton.addEventListener('mousedown', (e) => {
            backButton.style.transform = 'scale(0.92)';
            backButton.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.15)';
            
            // Ripple эффект
            const ripple = document.createElement('div');
            const rect = backButton.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: var(--tg-theme-button-color);
                border-radius: 12px;
                opacity: 0.1;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            backButton.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
        
        backButton.addEventListener('mouseup', () => {
            backButton.style.transform = 'scale(1)';
            backButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        
        backButton.addEventListener('mouseleave', () => {
            backButton.style.transform = 'scale(1)';
            backButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
        
        // Hover эффект
        backButton.addEventListener('mouseenter', () => {
            backButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        backButton.onclick = () => showScreen('main-menu');
        header.appendChild(backButton);
    }

    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        color: var(--tg-theme-text-color);
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        ${showBackButton ? 'position: absolute; left: 50%; transform: translateX(-50%);' : ''}
    `;
    
    header.appendChild(titleElement);

    return header;
}

// Создание кнопки в стиле Telegram
function createButton(text, mode = 'primary', onClick = null, disabled = false) {
    const button = document.createElement('button');
    button.textContent = text;
    button.disabled = disabled;
    
    const isPrimary = mode === 'primary';
    const isDestructive = mode === 'destructive';
    
    let backgroundColor, textColor, borderColor;
    
    if (isDestructive) {
        backgroundColor = 'transparent';
        textColor = 'var(--tg-theme-destructive-text-color, #ff3b30)';
        borderColor = 'var(--tg-theme-destructive-text-color, #ff3b30)';
    } else if (isPrimary) {
        backgroundColor = 'var(--tg-theme-button-color, #0088cc)';
        textColor = 'var(--tg-theme-button-text-color, #ffffff)';
        borderColor = 'none';
    } else {
        backgroundColor = 'transparent';
        textColor = 'var(--tg-theme-button-color, #0088cc)';
        borderColor = 'var(--tg-theme-button-color, #0088cc)';
    }
    
    button.style.cssText = `
        background: ${backgroundColor};
        color: ${textColor};
        border: ${borderColor === 'none' ? 'none' : `1px solid ${borderColor}`};
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 500;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        transition: all 0.2s ease;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: ${disabled ? '0.6' : '1'};
    `;

    if (onClick && !disabled) {
        button.onclick = onClick;
    }

    // Добавляем hover эффект
    if (!disabled) {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.98)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    }

    return button;
}

// Создание текстового поля в стиле Telegram
function createTextarea(placeholder = '', rows = 4) {
    const textarea = document.createElement('textarea');
    textarea.placeholder = placeholder;
    textarea.rows = rows;
    
    textarea.style.cssText = `
        width: 100%;
        background: var(--tg-theme-secondary-bg-color, #f0f0f0);
        border: 1px solid var(--tg-theme-section-separator-color, #e0e0e0);
        border-radius: 8px;
        padding: 12px;
        font-size: 16px;
        color: var(--tg-theme-text-color);
        resize: vertical;
        min-height: 100px;
        font-family: inherit;
        line-height: 1.4;
    `;
    
    // Фокус стили
    textarea.addEventListener('focus', () => {
        textarea.style.borderColor = 'var(--tg-theme-button-color, #0088cc)';
        textarea.style.outline = 'none';
    });
    
    textarea.addEventListener('blur', () => {
        textarea.style.borderColor = 'var(--tg-theme-section-separator-color, #e0e0e0)';
    });

    return textarea;
}

// Создание карточки в стиле Telegram
function createCard(content) {
    const card = document.createElement('div');
    card.style.cssText = `
        background: var(--tg-theme-secondary-bg-color, #f0f0f0);
        border-radius: 12px;
        padding: 16px;
        border: 1px solid var(--tg-theme-section-separator-color, #e0e0e0);
        margin-bottom: 12px;
    `;
    
    if (typeof content === 'string') {
        card.innerHTML = content;
    } else {
        card.appendChild(content);
    }
    
    return card;
}

// Навигация между экранами
async function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;
        
        // Обновляем состояние кнопок Telegram
        updateTelegramButtons(screenId);
        
        // Загружаем данные для экрана
        await loadScreenData(screenId);
    }
}

// Обновление кнопок Telegram
function updateTelegramButtons(screenId) {
    if (!tg) return;
    
    if (screenId === 'main-menu') {
        tg.BackButton.hide();
    } else {
        tg.BackButton.show();
    }
}

// Возврат назад
function goBack() {
    if (AppState.currentScreen === 'main-menu') {
        if (tg) tg.close();
    } else {
        showScreen('main-menu');
    }
}

// Загрузка данных для экрана
async function loadScreenData(screenId) {
    switch (screenId) {
        case 'ask-question':
            createQuestionScreen();
            // Загружаем историю для отображения предыдущих вопросов при необходимости
            await loadHistory();
            break;
        case 'questions-library':
            createQuestionsLibraryScreen();
            await loadQuestions(); // Перезагружаем вопросы с учетом текущего профиля
            renderQuestions();
            break;
        case 'history':
            await loadHistory();
            createHistoryScreen();
            renderHistory();
            break;
        case 'profile':
            createProfileScreen();
            renderProfile();
            break;
        case 'feedback':
            createFeedbackScreen();
            initFeedbackScreen();
            break;
    }
}

// Загрузка контента для экрана (старая функция для совместимости)
function loadScreenContent(screenId) {
    return loadScreenData(screenId);
}

// Создание экрана вопросов
function createQuestionScreen() {
    const header = document.getElementById('question-header');
    const formContainer = document.getElementById('question-form-container');
    
    if (!header || !formContainer) return;
    
    // Заголовок
    header.innerHTML = '';
    header.appendChild(createScreenHeader('Задать вопрос'));
    
    // Форма
    formContainer.innerHTML = '';
    
    const form = document.createElement('div');
    form.className = 'question-form';
    
    const label = document.createElement('label');
    label.textContent = 'Ваш вопрос:';
    label.style.cssText = `
        color: var(--tg-theme-text-color);
        font-weight: 500;
        margin-bottom: 8px;
        display: block;
    `;
    
    const textarea = createTextarea('Опишите вашу ситуацию или задайте вопрос...');
    textarea.id = 'question-input';
    
    const sendButton = createButton('Отправить', 'primary', sendQuestion);
    sendButton.id = 'send-question';
    
    form.appendChild(label);
    form.appendChild(textarea);
    form.appendChild(sendButton);
    
    formContainer.appendChild(form);
}

// Получение названия категории
function getCategoryName(category) {
    const names = {
        'Взаимодействие': 'Взаимодействие',
        'Обязанности': 'Обязанности',
        'Развитие': 'Развитие',
        'Дополнительно': 'Дополнительно',
        'Профессиональные навыки': 'Проф навыки',
        'development': 'Разработка',
        'analysis': 'Аналитика',
        'management': 'Управление',
        'testing': 'Тестирование'
    };
    return names[category] || category;
}

// Получение иконки для категории
function getCategoryIcon(category) {
    const icons = {
        'Взаимодействие': '🤝',
        'Обязанности': '📋',
        'Развитие': '📈',
        'Дополнительно': '💡',
        'development': '💻',
        'analysis': '📊',
        'management': '👥',
        'testing': '🧪'
    };
    return icons[category] || '❓';
}

// Отображение вопросов
function renderQuestions() {
    const questionsList = document.getElementById('questions-list');
    // ИСПРАВЛЕНО: показываем все вопросы, так как фильтрация отключена
    const questions = AppState.allQuestions || [];
    
    if (!questionsList) return;
    
    // Показываем скелетон при загрузке
    if (questions.length === 0 && AppState.questions === null) {
        showQuestionsLoadingSkeleton(questionsList);
        return;
    }
    
    questionsList.innerHTML = '';
    
    if (questions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: var(--tg-theme-hint-color);
        `;
        emptyState.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: var(--tg-theme-text-color);">Вопросы не найдены</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">Заполните профиль для получения персонализированных вопросов</p>
        `;
        questionsList.appendChild(emptyState);
        return;
    }
    
    questions.forEach((question, index) => {
        const div = document.createElement('div');
        div.className = 'question-item';
        div.style.cssText = `
            background: var(--tg-theme-secondary-bg-color);
            border: 1px solid var(--tg-theme-section-separator-color);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        
        // ИСПРАВЛЕНО: показываем только название вопроса без дублирования
        div.innerHTML = `
            <div class="question-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div class="question-meta" style="display: flex; align-items: center; flex: 1;">
                    <div class="question-icon" style="margin-right: 12px; font-size: 20px;">${getCategoryIcon(question.category)}</div>
                    <div class="question-title" style="font-weight: 600; color: var(--tg-theme-text-color); font-size: 16px; line-height: 1.4;">${question.title || question.text}</div>
                </div>
                <div class="question-category" style="background: var(--tg-theme-button-color); color: var(--tg-theme-button-text-color); padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 500; white-space: nowrap; margin-left: 12px;">${getCategoryName(question.category)}</div>
            </div>
        `;
        
        div.addEventListener('mousedown', () => {
            div.style.transform = 'scale(0.98)';
        });
        
        div.addEventListener('mouseup', () => {
            div.style.transform = 'scale(1)';
        });
        
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'scale(1)';
        });
        
        div.onclick = async () => await useQuestionDirectly(index);
        questionsList.appendChild(div);
    });
}

// Использование вопроса из библиотеки
async function useQuestionDirectly(index) {
    const questions = AppState.questions || [];
    const question = questions[index];
    
    if (!question) {
        showAlert('Вопрос не найден');
        return;
    }
    
    // Показываем заданный вопрос
    displayAskedQuestion(question.text);
    
    // Сохраняем вопрос для генерации связанных вопросов
    SuggestedQuestionsState.userQuestion = question.text;
    
    // Показываем полноэкранный лоадер
    showLoader();
    
    try {
        const userId = getUserId();
        
        // ИСПРАВЛЕНО: Используем prompt_id вместо id для question_id (как в телеграм боте)
        const questionId = question.prompt_id || question.id;
        
        // Используем специальный endpoint для библиотечных вопросов с кешированием
        const response = await fetch(`${CONFIG.API_BASE_URL}/ask_library`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question.text,
                question_id: questionId,
                user_id: userId,
                role: AppState.profile.role,
                specialization: AppState.profile.specialization
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            await displayAnswer(question.text, data.answer);
            
            // Добавляем в локальную историю
            AppState.history.unshift({
                id: Date.now(),
                question: question.text,
                answer: data.answer,
                timestamp: new Date(),
                role: AppState.profile.role,
                specialization: AppState.profile.specialization,
                cached: data.cached || false
            });
            
            // Перезагружаем историю из БД с задержкой
            setTimeout(async () => {
                await loadHistory();
                console.log('✅ История обновлена из БД');
            }, 500);
            
            // Переходим к экрану с ответом
            showScreen('ask-question');
            
            // Предыдущие вопросы будут показаны в displayAnswer
        } else {
            throw new Error('Ошибка получения ответа');
        }
    } catch (error) {
        console.error('Ошибка отправки библиотечного вопроса:', error);
        showAlert('Ошибка получения ответа. Попробуйте снова.');
    } finally {
        hideLoader();
    }
}

// Функции фильтрации вопросов - УДАЛЕНО, так как фильтрация отключена
// function filterQuestions() - удалена

function setupQuestionFilters() {
    // ИСПРАВЛЕНО: убираем фильтры и поиск, так как блок удален из HTML
    // Функция оставлена для совместимости, но больше ничего не делает
    console.log('Фильтры и поиск отключены в библиотеке вопросов');
}

// Создание экрана библиотеки вопросов
function createQuestionsLibraryScreen() {
    const header = document.getElementById('library-header');
    const questionsList = document.getElementById('questions-list');
    
    if (!header || !questionsList) return;
    
    header.innerHTML = '';
    header.appendChild(createScreenHeader('Библиотека вопросов'));
    
    questionsList.innerHTML = '<p style="color: var(--tg-theme-hint-color); text-align: center; padding: 20px;">Загрузка вопросов...</p>';
    
    // ИСПРАВЛЕНО: убираем настройку фильтров, сразу показываем вопросы
    setTimeout(() => {
        renderQuestions();
    }, 100);
}

// Отображение истории
function renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (!historyList) return;
    
    // Показываем скелетон при загрузке
    if (AppState.history.length === 0 && AppState.history === null) {
        showHistoryLoadingSkeleton(historyList);
        return;
    }
    
    historyList.innerHTML = '';
    
    console.log('Рендерим историю, количество элементов:', AppState.history.length);
    
    if (AppState.history.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: var(--tg-theme-hint-color);
        `;
        emptyState.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">📜</div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: var(--tg-theme-text-color);">История пуста</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">Задайте первый вопрос, чтобы начать</p>
        `;
        historyList.appendChild(emptyState);
        return;
    }
    
    AppState.history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.style.cssText = `
            background: var(--tg-theme-secondary-bg-color);
            border: 1px solid var(--tg-theme-section-separator-color);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: transform 0.2s ease;
        `;
        
        const date = new Date(item.timestamp).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const questionPreview = item.question.length > 80 ? 
            item.question.substring(0, 80) + '...' : 
            item.question;
            
        const answerPreview = item.answer.replace(/<[^>]*>/g, ''); // Убираем HTML теги
        const shortAnswer = answerPreview.length > 100 ? 
            answerPreview.substring(0, 100) + '...' : 
            answerPreview;
        
        div.innerHTML = `
            <div class="history-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div class="history-date" style="color: var(--tg-theme-hint-color); font-size: 12px;">${date}</div>
            </div>
            <div class="history-question" style="color: var(--tg-theme-text-color); font-weight: 600; font-size: 14px; margin-bottom: 8px;">${questionPreview}</div>
            <div class="history-answer" style="color: var(--tg-theme-hint-color); font-size: 13px; line-height: 1.4;">${shortAnswer}</div>
        `;
        
        div.addEventListener('mousedown', () => {
            div.style.transform = 'scale(0.98)';
        });
        
        div.addEventListener('mouseup', () => {
            div.style.transform = 'scale(1)';
        });
        
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'scale(1)';
        });
        
        div.onclick = () => showHistoryDetail(item);
        historyList.appendChild(div);
    });
}

// Показать детали истории
function showHistoryDetail(item) {
    // Создаем модальное окно
    let modal = document.getElementById('history-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'history-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        document.body.appendChild(modal);
    }
    
    const date = new Date(item.timestamp).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--tg-theme-bg-color);
            border-radius: 16px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 20px 16px 20px;
                border-bottom: 1px solid var(--tg-theme-section-separator-color);
            ">
                <h3 style="margin: 0; color: var(--tg-theme-text-color); font-size: 18px; font-weight: 600;">Детали диалога</h3>
                <button class="close-btn" onclick="closeHistoryModal()" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: var(--tg-theme-hint-color);
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                ">×</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div class="history-detail-meta" style="
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    margin-bottom: 16px;
                    padding: 12px;
                    background: var(--tg-theme-secondary-bg-color);
                    border-radius: 8px;
                ">
                    <span style="color: var(--tg-theme-hint-color); font-size: 14px;">${date}</span>
                </div>
                
                <div class="history-detail-question" style="margin-bottom: 20px;">
                    <h4 style="color: var(--tg-theme-text-color); margin-bottom: 8px; font-size: 16px; font-weight: 600;">Вопрос:</h4>
                    <div style="
                        background: var(--tg-theme-secondary-bg-color);
                        padding: 12px;
                        border-radius: 8px;
                        color: var(--tg-theme-text-color);
                        line-height: 1.5;
                    ">${item.question}</div>
                </div>
                
                <div class="history-detail-answer">
                    <h4 style="color: var(--tg-theme-text-color); margin-bottom: 8px; font-size: 16px; font-weight: 600;">Ответ:</h4>
                    <div style="
                        background: var(--tg-theme-secondary-bg-color);
                        padding: 12px;
                        border-radius: 8px;
                        color: var(--tg-theme-text-color);
                        line-height: 1.6;
                    " class="answer-text">${convertMarkdownToHtml(formatAnswerText(item.answer))}</div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Закрытие по клику на фон
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeHistoryModal();
        }
    };
}

// Закрыть модальное окно истории
function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Очистка истории
async function clearHistory() {
    // Показываем кастомное подтверждение
    showConfirmationModal(
        'Очистить историю?',
        'Это действие удалит все ваши предыдущие диалоги без возможности восстановления.',
        async () => {
            try {
                showLoader();
                const userId = getUserId();
                console.log('Отправляем запрос на очистку истории для пользователя:', userId);
                
                const response = await fetch(`${CONFIG.API_BASE_URL}/history/${userId}`, {
                    method: 'DELETE'
                });
                
                console.log('Ответ сервера на очистку истории:', response.status, response.statusText);
                
                if (response.ok) {
                    // Очищаем локальное состояние
                    AppState.history = [];
                    
                    // Перезагружаем историю с сервера для подтверждения
                    await loadHistory();
                    
                    // Обновляем отображение
                    renderHistory();
                    showAlert('История очищена');
                    
                    console.log('История успешно очищена');
                } else {
                    const errorText = await response.text();
                    console.error('Ошибка очистки истории:', response.status, errorText);
                    throw new Error(`Ошибка очистки истории: ${response.status}`);
                }
            } catch (error) {
                console.error('Ошибка очистки истории:', error);
                showAlert('Ошибка очистки истории: ' + error.message);
            } finally {
                hideLoader();
            }
        }
    );
}

// Создание экрана истории
function createHistoryScreen() {
    const header = document.getElementById('history-header');
    const historyList = document.getElementById('history-list');
    
    if (!header || !historyList) return;
    
    header.innerHTML = '';
    const headerElement = createScreenHeader('История диалогов');
    
    // Создаем кнопку "Очистить" в стиле Telegram UI для деструктивных действий
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Очистить';
    clearButton.style.cssText = `
        font-size: 16px;
        font-weight: 500;
        color: var(--tg-theme-destructive-text-color); /* Используем цвет для опасных действий */
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px 0; /* Такой же вертикальный паддинг как у "Назад" */
        margin-left: auto;
        -webkit-tap-highlight-color: transparent;
    `;

    clearButton.onclick = clearHistory;
    
    // Добавляем эффект при нажатии для визуальной обратной связи
    clearButton.addEventListener('mousedown', () => clearButton.style.opacity = '0.7');
    clearButton.addEventListener('mouseup', () => clearButton.style.opacity = '1');
    clearButton.addEventListener('mouseleave', () => clearButton.style.opacity = '1');
    
    headerElement.appendChild(clearButton);
    
    header.appendChild(headerElement);
    
    historyList.innerHTML = '<p style="color: var(--tg-theme-hint-color); text-align: center; padding: 20px;">Загрузка истории...</p>';
    
    // Рендерим историю
    setTimeout(() => {
        renderHistory();
    }, 100);
}

// Обновление специализаций при выборе роли
function updateSpecializations() {
    const roleSelect = document.getElementById('role-select');
    const specializationSelect = document.getElementById('specialization-select');
    
    if (!roleSelect || !specializationSelect) return;
    
    const role = roleSelect.value;
    
    // Очищаем список специализаций
    specializationSelect.innerHTML = '<option value="">Выберите специализацию</option>';
    
    // Для PO/PM специализация устанавливается автоматически
    if (role === 'PO/PM') {
        const option = document.createElement('option');
        option.value = 'PO/PM';
        option.textContent = 'PO/PM';
        option.selected = true;
        specializationSelect.appendChild(option);
        specializationSelect.disabled = true;
    } else {
        // Для других ролей показываем все доступные специализации
        specializationSelect.disabled = false;
        specializations.forEach(spec => {
            const option = document.createElement('option');
            option.value = spec.value;
            option.textContent = spec.label;
            specializationSelect.appendChild(option);
        });
    }
    
    // Обновляем информацию профиля при изменении
    setTimeout(() => {
        updateProfileInfo();
    }, 100);
}

// Обновление информации профиля
function updateProfileInfo() {
    const profileName = document.getElementById('profile-name');
    const profileStatus = document.getElementById('profile-status');
    
    if (!profileName || !profileStatus) return;
    
    const roleSelect = document.getElementById('role-select');
    const specializationSelect = document.getElementById('specialization-select');
    
    if (roleSelect) AppState.profile.role = roleSelect.value;
    if (specializationSelect) AppState.profile.specialization = specializationSelect.value;
    
    if (AppState.profile.role && AppState.profile.specialization) {
        profileName.textContent = `${AppState.profile.role} • ${AppState.profile.specialization}`;
        profileStatus.textContent = 'Профиль настроен';
    } else {
        profileName.textContent = 'Настройка профиля';
        profileStatus.textContent = 'Заполните информацию о себе';
    }
}

// Отображение профиля
function renderProfile() {
    const roleSelect = document.getElementById('role-select');
    const specializationSelect = document.getElementById('specialization-select');
    
    if (!roleSelect || !specializationSelect) return;
    
    // Заполняем список ролей
    roleSelect.innerHTML = '<option value="">Выберите вашу роль</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.value;
        option.textContent = role.label;
        roleSelect.appendChild(option);
    });
    
    // Устанавливаем значения из профиля
    if (AppState.profile.role) {
        roleSelect.value = AppState.profile.role;
        updateSpecializations();
        
        if (AppState.profile.specialization) {
            specializationSelect.value = AppState.profile.specialization;
        }
    }
    
    // Добавляем обработчики изменений
    roleSelect.addEventListener('change', async function() {
        console.log('🔄 Изменение роли:', this.value);
        AppState.profile.role = this.value;
        updateSpecializations();
        updateProfileInfo();
        
        // Автоматически сохраняем изменения
        if (AppState.profile.role && AppState.profile.specialization) {
            console.log('💾 Автосохранение профиля после изменения роли...');
            await autoSaveProfile();
        }
    });
    
    specializationSelect.addEventListener('change', async function() {
        console.log('🔄 Изменение специализации:', this.value);
        AppState.profile.specialization = this.value;
        updateProfileInfo();
        
        // Автоматически сохраняем изменения и перезагружаем вопросы
        if (AppState.profile.role && AppState.profile.specialization) {
            console.log('💾 Автосохранение профиля после изменения специализации...');
            await autoSaveProfile();
            
            console.log('📚 Перезагружаем вопросы для новой специализации...');
            await loadQuestions();
        }
    });
    
    // Обновляем информацию о профиле
    updateProfileInfo();
}

// Автоматическое сохранение профиля (без показа уведомлений)
async function autoSaveProfile() {
    console.log('🔄 Автосохранение профиля...');
    
    try {
        const userId = getUserId();
        
        if (!userId || userId === 'guest') {
            console.warn('⚠️ Не удалось автосохранить: User ID не определен');
            return false;
        }
        
        if (!AppState.profile.role || !AppState.profile.specialization) {
            console.warn('⚠️ Не удалось автосохранить: профиль неполный');
            return false;
        }
        
        const saveUrl = `${CONFIG.API_BASE_URL}/profile/${userId}`;
        const response = await fetch(saveUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(AppState.profile)
        });
        
        if (response.ok) {
            console.log('✅ Профиль автоматически сохранен в БД');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Ошибка автосохранения профиля:', {
                status: response.status,
                error: errorText
            });
            return false;
        }
    } catch (error) {
        console.error('❌ Исключение при автосохранении профиля:', error);
        return false;
    }
}

// Сохранение профиля
async function saveProfile() {
    console.log('💾 Сохраняем профиль...');
    
    const roleSelect = document.getElementById('role-select');
    const specializationSelect = document.getElementById('specialization-select');
    
    if (!roleSelect || !specializationSelect) {
        console.error('❌ Элементы select не найдены!');
        return;
    }
    
    AppState.profile.role = roleSelect.value;
    AppState.profile.specialization = specializationSelect.value;
    
    console.log('📝 Данные профиля для сохранения:', AppState.profile);
    
    if (!AppState.profile.role || !AppState.profile.specialization) {
        console.warn('⚠️ Не все поля заполнены');
        showAlert('Пожалуйста, заполните все поля профиля');
        return;
    }
    
    try {
        const userId = getUserId();
        console.log('🔑 User ID для сохранения:', userId);
        
        const saveUrl = `${CONFIG.API_BASE_URL}/profile/${userId}`;
        console.log('🌐 URL для сохранения:', saveUrl);
        
        const requestData = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(AppState.profile)
        };
        
        console.log('📤 Отправляем запрос:', requestData);
        
        const response = await fetch(saveUrl, requestData);
        console.log('📊 Статус ответа сохранения:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('✅ Профиль сохранен успешно:', responseData);
            
            console.log('🔄 Перезагружаем вопросы для новой роли...');
            await loadQuestions(); // Перезагружаем вопросы для новой роли
            
            showAlert('Профиль сохранен!');
            showScreen('main-menu');
        } else {
            const errorText = await response.text();
            console.error('❌ Ошибка API сохранения профиля:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Ошибка сохранения профиля: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА сохранения профиля:', error);
        console.error('📋 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        showAlert('Ошибка сохранения профиля');
    }
}

// Создание экрана профиля
function createProfileScreen() {
    const header = document.getElementById('profile-header');
    const profileContent = document.getElementById('profile-content');
    
    if (!header || !profileContent) return;
    
    header.innerHTML = '';
    header.appendChild(createScreenHeader('Профиль'));
    
    // Создаем содержимое профиля
    profileContent.innerHTML = `
        <!-- Информация о пользователе -->
        <div class="profile-info" style="display: flex; align-items: center; margin-bottom: 24px; padding: 16px; background: var(--tg-theme-secondary-bg-color); border-radius: 12px;">
            <div class="profile-avatar" style="margin-right: 16px;">
                <div class="avatar-placeholder" style="width: 60px; height: 60px; background: var(--tg-theme-button-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px;">👤</div>
            </div>
            <div class="profile-details">
                <h3 id="profile-name" style="color: var(--tg-theme-text-color); margin: 0 0 4px 0; font-size: 18px; font-weight: 600;">Настройка профиля</h3>
                <p id="profile-status" style="color: var(--tg-theme-hint-color); margin: 0; font-size: 14px;">Заполните информацию о себе</p>
            </div>
        </div>

        <!-- Форма профиля -->
        <div class="profile-form">
            <div class="form-section" style="margin-bottom: 24px;">
                <h4 style="color: var(--tg-theme-text-color); margin-bottom: 8px;">Роль в команде</h4>
                <div class="select-wrapper" style="position: relative;">
                    <select id="role-select" onchange="updateSpecializations()" style="width: 100%; padding: 12px; border: 1px solid var(--tg-theme-section-separator-color); border-radius: 8px; background: var(--tg-theme-secondary-bg-color); color: var(--tg-theme-text-color); font-size: 16px; appearance: none;">
                        <option value="">Выберите вашу роль</option>
                    </select>
                    <div class="select-icon" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--tg-theme-hint-color);">▼</div>
                </div>
                <p class="field-description" style="color: var(--tg-theme-hint-color); font-size: 12px; margin-top: 4px;">Выберите роль, которая лучше всего описывает вашу должность</p>
            </div>
            
            <div class="form-section" style="margin-bottom: 24px;">
                <h4 style="color: var(--tg-theme-text-color); margin-bottom: 8px;">Специализация</h4>
                <div class="select-wrapper" style="position: relative;">
                    <select id="specialization-select" style="width: 100%; padding: 12px; border: 1px solid var(--tg-theme-section-separator-color); border-radius: 8px; background: var(--tg-theme-secondary-bg-color); color: var(--tg-theme-text-color); font-size: 16px; appearance: none;">
                        <option value="">Сначала выберите роль</option>
                    </select>
                    <div class="select-icon" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--tg-theme-hint-color);">▼</div>
                </div>
                <p class="field-description" style="color: var(--tg-theme-hint-color); font-size: 12px; margin-top: 4px;">Укажите вашу техническую специализацию</p>
            </div>
        </div>
        
        <div class="profile-actions">
            <button class="primary-btn full-width" onclick="saveProfile()" style="width: 100%; padding: 16px; background: var(--tg-theme-button-color); color: var(--tg-theme-button-text-color); border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
                <span class="btn-icon">💾</span>
                Сохранить профиль
            </button>
        </div>
    `;
    
    // Рендерим профиль после создания элементов
    setTimeout(() => {
        renderProfile();
    }, 100);
}

// Инициализация счетчика символов
function initCharCounter() {
    const textarea = document.getElementById('feedback-input');
    if (textarea) {
        updateCharCounter();
    }
}

// Обновление счетчика символов
function updateCharCounter() {
    const textarea = document.getElementById('feedback-input');
    const charCounter = document.getElementById('char-counter');
    
    if (textarea && charCounter) {
        const length = textarea.value.length;
        const maxLength = 1000;
        
        charCounter.textContent = `${length}/${maxLength}`;
        
        if (length > maxLength * 0.9) {
            charCounter.style.color = 'var(--tg-theme-destructive-text-color, #ff4444)';
        } else if (length > maxLength * 0.7) {
            charCounter.style.color = 'var(--tg-theme-accent-text-color, #ff8800)';
        } else {
            charCounter.style.color = 'var(--tg-theme-hint-color)';
        }
    }
}

// Безопасный alert
function safeAlert(msg) {
    try {
        if (tg && typeof tg.showAlert === 'function') {
            tg.showAlert(String(msg));
        } else {
            alert(String(msg));
        }
    } catch (error) {
        console.error('Ошибка показа уведомления:', error);
        console.log('Сообщение:', msg);
    }
}

// Отправка обратной связи
async function sendFeedback() {
    const feedbackInput = document.getElementById('feedback-input');
    const sendBtn = document.getElementById('feedback-submit-btn');
    const btnText = sendBtn.querySelector('.btn-text');
    const spinner = sendBtn.querySelector('.spinner');
    const feedbackForm = document.querySelector('.feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');
    
    const feedback = feedbackInput.value.trim();
    if (!feedback) {
        safeAlert('Пожалуйста, введите ваш отзыв');
        feedbackInput.focus();
        return;
    }
    
    if (feedback.length < 10) {
        safeAlert('Пожалуйста, напишите более подробный отзыв (минимум 10 символов)');
        feedbackInput.focus();
        return;
    }
    
    // Показываем лоадер на кнопке
    sendBtn.disabled = true;
    btnText.textContent = 'Отправляем...';
    if (spinner) spinner.classList.remove('hidden');
    
    // Добавляем эффект загрузки на кнопку
    sendBtn.style.transform = 'scale(0.98)';
    
    try {
        const userId = getUserId();
        const userName = AppState.user?.first_name || 'Пользователь';
        const userUsername = AppState.user?.username || 'не указан';
        
        // Очищаем данные от потенциально проблемных символов
        const cleanFeedback = feedback.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
        const cleanUserName = String(userName).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() || 'Пользователь';
        const cleanUsername = String(userUsername).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() || 'не указан';
        
        console.log('Исходные данные пользователя:', {
            userId: userId,
            userName: userName,
            userUsername: userUsername,
            feedback: feedback
        });
        
        console.log('Очищенные данные:', {
            userId: userId,
            userName: cleanUserName,
            userUsername: cleanUsername,
            feedback: cleanFeedback
        });
        
        const requestData = {
            feedback: cleanFeedback,
            user_id: userId,
            user_name: cleanUserName,
            username: cleanUsername,
            role: AppState.profile.role || 'Не указана',
            specialization: AppState.profile.specialization || 'Не указана',
            category: 'general'
        };
        
        console.log('Отправляем данные обратной связи:', requestData);
        console.log('URL:', `${CONFIG.API_BASE_URL}/feedback`);
        
        // Сначала проверим соединение с сервером
        try {
            const testResponse = await fetch(`${CONFIG.API_BASE_URL}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({test: 'connection'})
            });
            console.log('Тест соединения:', testResponse.status, testResponse.statusText);
            if (!testResponse.ok) {
                throw new Error(`Сервер недоступен: ${testResponse.status}`);
            }
        } catch (testError) {
            console.error('Ошибка соединения с сервером:', testError);
            throw new Error('Не удается подключиться к серверу. Проверьте, что сервер запущен.');
        }
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Ответ сервера:', response.status, response.statusText);
        
        if (response.ok) {
            // Скрываем форму и показываем сообщение об успехе
            setTimeout(() => {
                if (feedbackForm) feedbackForm.classList.add('hidden');
                if (feedbackSuccess) feedbackSuccess.classList.remove('hidden');
                
                // Запускаем конфетти анимацию
                triggerConfettiAnimation();
            }, 300);
            
            // Очищаем поле ввода
            feedbackInput.value = '';
            
        } else {
            // Получаем детали ошибки от сервера
            let errorMessage = `Ошибка ${response.status}. Попробуйте снова.`;
            try {
                const errorData = await response.json();
                console.log('Детали ошибки:', errorData);
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                console.error('Не удалось распарсить ошибку:', parseError);
                const errorText = await response.text();
                console.log('Текст ошибки:', errorText);
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Ошибка отправки обратной связи:', error);
        // Показываем конкретную ошибку, убедившись, что это строка
        const finalMessage = String(error.message || 'Произошла неизвестная ошибка. Пожалуйста, проверьте консоль.');
        safeAlert(finalMessage);
        
        // Встряхиваем кнопку при ошибке
        sendBtn.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            sendBtn.style.animation = '';
        }, 500);
        
    } finally {
        // Возвращаем кнопку в исходное состояние
        sendBtn.disabled = false;
        btnText.textContent = '📤 Отправить отзыв';
        if (spinner) spinner.classList.add('hidden');
        sendBtn.style.transform = '';
    }
}

// Анимация конфетти
function triggerConfettiAnimation() {
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach((confetti, index) => {
        confetti.style.animationDelay = `${index * 0.1}s`;
        confetti.style.animationDuration = `${2 + Math.random()}s`;
    });
}

// Сброс формы обратной связи
function resetFeedbackForm() {
    const feedbackInput = document.getElementById('feedback-input');
    const feedbackForm = document.querySelector('.feedback-form');
    const feedbackSuccess = document.getElementById('feedback-success');
    const charCounter = document.getElementById('char-counter');
    
    if (feedbackInput) {
        feedbackInput.value = '';
    }
    
    if (charCounter) {
        charCounter.textContent = '0/1000';
        charCounter.style.color = 'var(--tg-theme-hint-color)';
    }
    
    if (feedbackForm) {
        feedbackForm.classList.remove('hidden');
    }
    if (feedbackSuccess) {
        feedbackSuccess.classList.add('hidden');
    }
    
    if (feedbackInput) {
        setTimeout(() => {
            feedbackInput.focus();
        }, 100);
    }
}

// Инициализация экрана обратной связи
function initFeedbackScreen() {
    initCharCounter();
    resetFeedbackForm();
}

// Создание экрана обратной связи
function createFeedbackScreen() {
    const header = document.getElementById('feedback-header');
    const feedbackContent = document.getElementById('feedback-content');
    
    if (!header || !feedbackContent) return;
    
    header.innerHTML = '';
    header.appendChild(createScreenHeader('Обратная связь'));
    
    // Создаем содержимое обратной связи
    feedbackContent.innerHTML = `
        <!-- Информационная секция -->
        <div class="feedback-hero" style="text-align: center; margin-bottom: 20px; padding: 16px; background: var(--tg-theme-secondary-bg-color); border-radius: 12px;">
            <div class="feedback-icon-large" style="font-size: 32px; margin-bottom: 8px;">💬</div>
            <h3 style="color: var(--tg-theme-text-color); margin: 0 0 6px 0; font-size: 18px; font-weight: 600;">Поделитесь своим мнением</h3>
            <p style="color: var(--tg-theme-hint-color); margin: 0; font-size: 14px; line-height: 1.4;">Ваши отзывы помогают нам делать GigaMentor лучше!</p>
        </div>

        <!-- Форма обратной связи -->
        <div class="feedback-form">
            <div class="input-group" style="margin-bottom: 16px;">
                <label for="feedback-input" style="display: block; color: var(--tg-theme-text-color); font-weight: 500; margin-bottom: 8px;">
                    <span class="label-text">Ваш отзыв или предложение</span>
                </label>
                <div class="textarea-wrapper" style="position: relative;">
                    <textarea 
                        id="feedback-input" 
                        placeholder="Поделитесь своими мыслями о приложении, предложениями по улучшению или сообщите о проблемах..."
                        maxlength="1000"
                        oninput="updateCharCounter()"
                        style="
                            width: 100%;
                            min-height: 120px;
                            background: var(--tg-theme-secondary-bg-color);
                            border: 1px solid var(--tg-theme-section-separator-color);
                            border-radius: 8px;
                            padding: 12px;
                            font-size: 16px;
                            color: var(--tg-theme-text-color);
                            resize: vertical;
                            font-family: inherit;
                            line-height: 1.4;
                        "
                    ></textarea>
                    <div id="char-counter" class="char-counter" style="
                        position: absolute;
                        bottom: 8px;
                        right: 12px;
                        font-size: 12px;
                        color: var(--tg-theme-hint-color);
                        background: var(--tg-theme-bg-color);
                        padding: 2px 4px;
                        border-radius: 4px;
                    ">0/1000</div>
                </div>
            </div>
            
            <button id="feedback-submit-btn" class="primary-btn full-width" onclick="sendFeedback()" style="
                width: 100%;
                padding: 16px;
                background: var(--tg-theme-button-color);
                color: var(--tg-theme-button-text-color);
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            ">
                <span class="btn-text">📤 Отправить отзыв</span>
                <div class="spinner hidden" style="width: 16px; height: 16px;"></div>
            </button>
        </div>

        <!-- Сообщение об успехе -->
        <div id="feedback-success" class="feedback-success hidden" style="text-align: center; padding: 40px 20px;">
            <div class="success-animation" style="position: relative; margin-bottom: 20px;">
                <div class="success-icon" style="font-size: 64px; margin-bottom: 16px;">🎉</div>
                <div class="success-confetti" style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100px; height: 100px; pointer-events: none;">
                    <div class="confetti" style="position: absolute; width: 10px; height: 10px; background: #ff6b6b; animation: confetti-fall 3s ease-out infinite;"></div>
                    <div class="confetti" style="position: absolute; width: 10px; height: 10px; background: #4ecdc4; animation: confetti-fall 3s ease-out infinite;"></div>
                    <div class="confetti" style="position: absolute; width: 10px; height: 10px; background: #45b7d1; animation: confetti-fall 3s ease-out infinite;"></div>
                    <div class="confetti" style="position: absolute; width: 10px; height: 10px; background: #f9ca24; animation: confetti-fall 3s ease-out infinite;"></div>
                    <div class="confetti" style="position: absolute; width: 10px; height: 10px; background: #6c5ce7; animation: confetti-fall 3s ease-out infinite;"></div>
                </div>
            </div>
            <h3 style="color: var(--tg-theme-text-color); margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Спасибо за отзыв!</h3>
            <p style="color: var(--tg-theme-hint-color); margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">Ваше мнение очень важно для нас. Мы обязательно рассмотрим ваши предложения.</p>
            <div class="success-actions" style="display: flex; gap: 12px; justify-content: center;">
                <button class="primary-btn" onclick="resetFeedbackForm()" style="
                    padding: 12px 20px;
                    background: var(--tg-theme-button-color);
                    color: var(--tg-theme-button-text-color);
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                ">
                    <span>✨ Оставить еще отзыв</span>
                </button>
                <button class="secondary-btn" onclick="showScreen('main-menu')" style="
                    padding: 12px 20px;
                    background: transparent;
                    color: var(--tg-theme-button-color);
                    border: 1px solid var(--tg-theme-button-color);
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                ">
                    <span>🏠 В главное меню</span>
                </button>
            </div>
        </div>
    `;
    
    // Инициализируем экран обратной связи
    setTimeout(() => {
        initFeedbackScreen();
    }, 100);
}

// УПРОЩЕНО: Убрана логика определения question_id
// Теперь всегда используем question_id = 888 для свободного ввода (как в телеграм боте)
async function detectQuestionId(questionText) {
    console.log(`💬 Свободный ввод вопроса: "${questionText}" → используем question_id = 888`);
    return null; // Всегда свободный ввод
}

// Отображение заданного вопроса
function displayAskedQuestion(question) {
    const askedQuestionContainer = document.getElementById('asked-question-container');
    const askedQuestionText = document.getElementById('asked-question-text');
    
    if (askedQuestionContainer && askedQuestionText) {
        askedQuestionText.textContent = question;
        askedQuestionContainer.classList.remove('hidden');
    }
}

// Отправка вопроса
async function sendQuestion() {
    console.log('❓ Отправляем вопрос...');
    
    const questionInput = document.getElementById('question-input');
    const sendBtn = document.getElementById('send-question');
    
    if (!questionInput || !sendBtn) {
        console.error('❌ Элементы формы не найдены!');
        return;
    }
    
    const question = questionInput.value.trim();
    console.log('📝 Текст вопроса:', question);
    
    if (!question) {
        console.warn('⚠️ Пустой вопрос');
        showAlert('Пожалуйста, введите ваш вопрос');
        return;
    }
    
    const userId = getUserId();
    console.log('🔑 User ID для отправки:', userId);
    
    // Показываем заданный вопрос
    displayAskedQuestion(question);
    
    // Показываем полноэкранный лоадер
    showLoader();
    
    // Блокируем кнопку и показываем спиннер
    sendBtn.disabled = true;
    const btnText = sendBtn.querySelector('.btn-text') || sendBtn;
    const spinner = sendBtn.querySelector('.spinner');
    
    btnText.textContent = 'Отправляем...';
    if (spinner) spinner.classList.remove('hidden');
    
    try {
        // УПРОЩЕНО: Всегда используем свободный ввод (question_id = null → 888 на бэкенде)
        const requestPayload = {
            question: question,
            user_id: userId,
            role: AppState.profile.role,
            specialization: AppState.profile.specialization,
            question_id: null  // Всегда null для свободного ввода
        };
        
        console.log('📤 Отправляем данные (свободный ввод):', requestPayload);
        
        // Всегда используем endpoint для свободного ввода
        const askUrl = `${CONFIG.API_BASE_URL}/ask`;
        
        console.log('🌐 URL для отправки:', askUrl, '(free input, question_id = 888)');
        
        const response = await fetch(askUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload)
        });
        
        console.log('📊 Статус ответа отправки:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Ответ получен:', data);
            
            // Отображаем ответ и запускаем генерацию связанных вопросов
            await displayAnswer(question, data.answer);
            
            // Добавляем в локальную историю
            AppState.history.unshift({
                id: Date.now(),
                question: question,
                answer: data.answer,
                timestamp: new Date(),
                role: AppState.profile.role,
                specialization: AppState.profile.specialization
            });
            
            // Перезагружаем историю из БД с задержкой
            setTimeout(async () => {
                await loadHistory();
                console.log('✅ История обновлена из БД');
            }, 500);
            
            // Очищаем поле ввода
            questionInput.value = '';
            console.log('✅ Вопрос обработан успешно');
            
            // Предыдущие вопросы будут показаны в displayAnswer
            
        } else {
            const errorText = await response.text();
            console.error('❌ Ошибка API отправки вопроса:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Ошибка получения ответа: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА отправки вопроса:', error);
        console.error('📋 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        showAlert('Ошибка отправки вопроса. Попробуйте снова.');
    } finally {
        // Скрываем полноэкранный лоадер
        hideLoader();
        
        // Скрываем лоадер на кнопке
        sendBtn.disabled = false;
        btnText.textContent = 'Отправить';
        if (spinner) spinner.classList.add('hidden');
    }
}

// Форматирование ответа с улучшенной пунктуацией
function formatAnswerText(text) {
    if (!text) return '';
    
    console.log('📝 Исходный текст для форматирования:', text.substring(0, 200) + '...');
    
    // Сначала постобрабатываем текст для исправления типичных ошибок
    const processedText = postProcessAnswer(text);
    console.log('🔧 После постобработки (первые 200 символов):', processedText.substring(0, 200) + '...');
    
    // Проверим наличие заголовков для отладки
    const headers = processedText.match(/^#{1,6}\s+.+$/gm);
    if (headers) {
        console.log('🔍 Найденные заголовки:', headers);
    } else {
        console.log('⚠️ Заголовки не найдены в тексте');
    }
    
    return processedText;
}

// Улучшенное преобразование Markdown в HTML
function convertMarkdownToHtml(text) {
    console.log('🔄 Начинаем обработку Markdown:', text.substring(0, 200) + '...');
    
    if (!text || typeof text !== 'string') {
        console.warn('⚠️ Получен некорректный текст для обработки Markdown');
        return '';
    }

    let html = text;
    
    // 1. ПРЕДВАРИТЕЛЬНАЯ ОЧИСТКА И НОРМАЛИЗАЦИЯ
    // Убираем лишние пробелы в начале и конце
    html = html.trim();
    
    // Нормализуем переносы строк
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // 2. ОБРАБОТКА ЗАГОЛОВКОВ (КРИТИЧЕСКИ ВАЖНО!)
    // Заголовки первого уровня # (должны быть с пробелом после #)
    html = html.replace(/^# ([^\n]+)$/gm, '<h1 class="markdown-h1 slide-in">$1</h1>');
    
    // Заголовки второго уровня ## (должны быть с пробелом после ##)
    html = html.replace(/^## ([^\n]+)$/gm, '<h2 class="markdown-h2 slide-in">$1</h2>');
    
    // Заголовки третьего уровня ### (должны быть с пробелом после ###)
    html = html.replace(/^### ([^\n]+)$/gm, '<h3 class="markdown-h3 slide-in">$1</h3>');
    
    // 3. ОБРАБОТКА ТЕКСТОВЫХ ВЫДЕЛЕНИЙ
    // Жирный текст **text**
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    
    // Курсив *text*
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    
    // Код `text`
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // 4. ОБРАБОТКА СПИСКОВ
    // Разбиваем текст на блоки по пустым строкам
    const blocks = html.split(/\n\s*\n/);
    const processedBlocks = blocks.map(block => {
        const lines = block.trim().split('\n');
        
        // Проверяем, является ли блок списком
        const isOrderedList = lines.every(line => 
            line.trim() === '' || 
            /^\s*\d+\.\s/.test(line) || 
            /^<h[1-6]/.test(line) ||
            /^<strong>/.test(line)
        );
        
        const isUnorderedList = lines.every(line => 
            line.trim() === '' || 
            /^\s*[-*]\s/.test(line) || 
            /^\s*--\s/.test(line) || 
            /^<h[1-6]/.test(line) ||
            /^<strong>/.test(line)
        );
        
        if (isOrderedList && lines.some(line => /^\s*\d+\.\s/.test(line))) {
            // Обрабатываем нумерованный список
            const listItems = lines
                .filter(line => /^\s*\d+\.\s/.test(line))
                .map(line => {
                    const content = line.replace(/^\s*\d+\.\s/, '').trim();
                    return `<li>${content}</li>`;
                })
                .join('\n');
            
            const nonListLines = lines
                .filter(line => !/^\s*\d+\.\s/.test(line) && line.trim() !== '')
                .join('\n');
            
            return nonListLines + (nonListLines ? '\n' : '') + `<ol class="markdown-list">\n${listItems}\n</ol>`;
        }
        
        if (isUnorderedList && lines.some(line => /^\s*[-*--]\s/.test(line))) {
            // Обрабатываем маркированный список
            const listItems = lines
                .filter(line => /^\s*[-*--]\s/.test(line))
                .map(line => {
                    const content = line.replace(/^\s*[-*--]\s/, '').trim();
                    return `<li>${content}</li>`;
                })
                .join('\n');
            
            const nonListLines = lines
                .filter(line => !/^\s*[-*--]\s/.test(line) && line.trim() !== '')
                .join('\n');
            
            return nonListLines + (nonListLines ? '\n' : '') + `<ul class="markdown-list">\n${listItems}\n</ul>`;
        }
        
        // Если это не список, возвращаем как обычный блок
        return block;
    });
    
    html = processedBlocks.join('\n\n');
    
    // 5. ОБРАБОТКА АБЗАЦЕВ
    // Разбиваем на абзацы, исключая уже обработанные элементы
    const paragraphBlocks = html.split(/\n\s*\n/);
    const finalBlocks = paragraphBlocks.map(block => {
        const trimmedBlock = block.trim();
        
        // Пропускаем пустые блоки
        if (!trimmedBlock) return '';
        
        // Пропускаем уже обработанные HTML элементы
        if (trimmedBlock.startsWith('<h') || 
            trimmedBlock.startsWith('<ul') || 
            trimmedBlock.startsWith('<ol') ||
            trimmedBlock.includes('</h') ||
            trimmedBlock.includes('</ul>') ||
            trimmedBlock.includes('</ol>')) {
            return trimmedBlock;
        }
        
        // Оборачиваем в параграф только если это обычный текст
        const lines = trimmedBlock.split('\n').filter(line => line.trim());
        if (lines.length > 0 && !lines[0].startsWith('<')) {
            return `<p class="markdown-paragraph">${trimmedBlock.replace(/\n/g, '<br>')}</p>`;
        }
        
        return trimmedBlock;
    });
    
    html = finalBlocks.filter(block => block.trim()).join('\n\n');
    
    // 6. ФИНАЛЬНАЯ ОЧИСТКА
    // Убираем лишние пустые строки
    html = html.replace(/\n{3,}/g, '\n\n');
    
    // Убираем пустые параграфы
    html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
    
    // Убираем пустые списки
    html = html.replace(/<[uo]l[^>]*>\s*<\/[uo]l>/g, '');
    
    console.log('✅ Markdown обработан. Результат:', html.substring(0, 300) + '...');
    
    return html.trim();
}

// Отображение ответа
async function displayAnswer(userQuestion, botAnswer) {
    const answerContainer = document.getElementById('answer-container');
    const answerContent = document.getElementById('answer-content');
    if (!answerContainer || !answerContent) return;
    
    // Сохраняем данные для генерации связанных вопросов
    SuggestedQuestionsState.userQuestion = userQuestion;
    SuggestedQuestionsState.botAnswer = botAnswer;
    
    // Форматируем и конвертируем ответ
    const formattedAnswer = formatAnswerText(botAnswer);
    const htmlAnswer = convertMarkdownToHtml(formattedAnswer);
    
    const answerCard = createCard(`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="color: var(--tg-theme-text-color); margin: 0;">Ответ:</h3>
            <button onclick="copyAnswerToClipboard()" style="
                background: var(--tg-theme-button-color);
                color: var(--tg-theme-button-text-color);
                border: none;
                padding: 8px 12px;
                border-radius: 8px;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
            ">
                📋 Копировать
            </button>
        </div>
        <div class="answer-text" style="color: var(--tg-theme-text-color);" id="answer-text-content">${htmlAnswer}</div>
    `);
    
    answerContent.innerHTML = '';
    answerContent.appendChild(answerCard);
    answerContainer.classList.remove('hidden');
    
    // Прокрутка к самому верху страницы сразу после вывода ответа
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Запускаем асинхронную генерацию связанных вопросов
    await generateSuggestedQuestions();
    
    // Показываем предыдущие вопросы из истории в самом конце
    setTimeout(async () => {
        await displayPreviousQuestions();
    }, 100);
}

// Функция копирования ответа в буфер обмена
async function copyAnswerToClipboard() {
    const answerElement = document.getElementById('answer-text-content');
    if (!answerElement) return;
    
    // Получаем текст без HTML тегов
    const textContent = answerElement.innerText || answerElement.textContent;
    
    try {
        await navigator.clipboard.writeText(textContent);
        
        // Показываем уведомление об успешном копировании
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        button.innerHTML = '✅ Скопировано!';
        button.style.background = 'var(--tg-theme-destructive-text-color)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'var(--tg-theme-button-color)';
        }, 2000);
        
        // Также показываем Telegram уведомление если доступно
        if (tg.showAlert) {
            tg.showAlert('Ответ скопирован в буфер обмена!');
        }
    } catch (err) {
        console.error('Ошибка копирования:', err);
        
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showAlert('Ответ скопирован в буфер обмена!');
        } catch (fallbackErr) {
            showAlert('Не удалось скопировать текст');
        }
        
        document.body.removeChild(textArea);
    }
}

// Отображение предложенных вопросов
function displaySuggestedQuestions(questions) {
    const suggestedContainer = document.getElementById('suggested-questions');
    const suggestedList = document.getElementById('suggested-list');
    
    if (!suggestedContainer || !suggestedList) return;
    
    suggestedList.innerHTML = '';
    
    // Ограничиваем количество вопросов до 3
    const limitedQuestions = questions.slice(0, 3);
    
    limitedQuestions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'suggested-question-card';
        questionCard.style.cssText = `
            background: var(--tg-theme-secondary-bg-color);
            border: 1px solid var(--tg-theme-section-separator-color);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        `;
        
        questionCard.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="
                    background: var(--tg-theme-button-color);
                    color: var(--tg-theme-button-text-color);
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 600;
                    flex-shrink: 0;
                    margin-top: 2px;
                ">💡</div>
                <div style="
                    color: var(--tg-theme-text-color);
                    font-size: 15px;
                    line-height: 1.4;
                    flex: 1;
                ">${question}</div>
            </div>
        `;
        
        // Добавляем эффекты при взаимодействии
        questionCard.addEventListener('mousedown', () => {
            questionCard.style.transform = 'scale(0.98)';
            questionCard.style.backgroundColor = 'var(--tg-theme-section-bg-color)';
        });
        
        questionCard.addEventListener('mouseup', () => {
            questionCard.style.transform = 'scale(1)';
            questionCard.style.backgroundColor = 'var(--tg-theme-secondary-bg-color)';
        });
        
        questionCard.addEventListener('mouseleave', () => {
            questionCard.style.transform = 'scale(1)';
            questionCard.style.backgroundColor = 'var(--tg-theme-secondary-bg-color)';
        });
        
        questionCard.onclick = () => {
            document.getElementById('question-input').value = question;
            sendQuestion();
        };
        
        suggestedList.appendChild(questionCard);
    });
    
    suggestedContainer.classList.remove('hidden');
}

// Состояние для связанных вопросов
const SuggestedQuestionsState = {
    currentQuestions: [],
    userQuestion: '',
    botAnswer: ''
};

// Генерация связанных вопросов
async function generateSuggestedQuestions() {
    const suggestedContainer = document.getElementById('suggested-questions');
    const suggestedList = document.getElementById('suggested-list');
    
    if (!suggestedContainer || !suggestedList) return;
    
    try {
        // Показываем спиннер
        suggestedList.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
        suggestedContainer.classList.remove('hidden');
        
        // Пробуем WebSocket
        const ws = new WebSocket(CONFIG.WEBSOCKET_URL);
        let wsTimeout = setTimeout(() => {
            ws.close();
            generateSuggestedQuestionsHTTP();
        }, 5000);
        
        ws.onopen = () => {
            clearTimeout(wsTimeout);
            ws.send(JSON.stringify({
                type: 'generate_questions',
                user_question: SuggestedQuestionsState.userQuestion,
                bot_answer: SuggestedQuestionsState.botAnswer,
                role: AppState.profile.role,
                specialization: AppState.profile.specialization
            }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'suggested_questions') {
                const questions = Array.isArray(data.questions) ? data.questions : data.questions || [];
                SuggestedQuestionsState.currentQuestions = questions;
                displaySuggestedQuestions(questions);
                ws.close();
            }
        };
        
        ws.onerror = () => {
            clearTimeout(wsTimeout);
            generateSuggestedQuestionsHTTP();
        };
        
    } catch (error) {
        console.error('Ошибка WebSocket:', error);
        generateSuggestedQuestionsHTTP();
    }
}

// HTTP fallback для связанных вопросов
async function generateSuggestedQuestionsHTTP() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/suggest_questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_question: SuggestedQuestionsState.userQuestion,
                bot_answer: SuggestedQuestionsState.botAnswer,
                role: AppState.profile.role,
                specialization: AppState.profile.specialization
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const questions = Array.isArray(data) ? data : data.questions || [];
            SuggestedQuestionsState.currentQuestions = questions;
            displaySuggestedQuestions(questions);
        }
    } catch (error) {
        console.error('Ошибка HTTP генерации вопросов:', error);
        const suggestedContainer = document.getElementById('suggested-questions');
        if (suggestedContainer) {
            suggestedContainer.classList.add('hidden');
        }
    }
}

// Отображение предыдущих вопросов
async function displayPreviousQuestions() {
    const previousContainer = document.getElementById('previous-questions');
    const previousList = document.getElementById('previous-list');
    
    if (!previousContainer || !previousList) return;
    
    try {
        // Загружаем актуальную историю из БД
        const userId = getUserId();
        const response = await fetch(`${CONFIG.API_BASE_URL}/history/${userId}`);
        if (!response.ok) {
            previousContainer.classList.add('hidden');
            return;
        }
        
        const historyFromDB = await response.json();
        if (!historyFromDB || historyFromDB.length === 0) {
            previousContainer.classList.add('hidden');
            return;
        }
        
        // Получаем последние 3 вопроса из истории (исключая самый последний)
        const recentQuestions = historyFromDB.slice(1, 4);
        
        if (!recentQuestions || recentQuestions.length === 0) {
            previousContainer.classList.add('hidden');
            return;
        }
        
        previousList.innerHTML = '';
    
        recentQuestions.forEach((historyItem, index) => {
            const historyCard = document.createElement('div');
            historyCard.className = 'previous-question-card';
            historyCard.style.cssText = `
                background: var(--tg-theme-secondary-bg-color);
                border: 1px solid var(--tg-theme-section-separator-color);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            `;
            
            const questionText = historyItem.question.length > 100 ? 
                historyItem.question.substring(0, 100) + '...' : 
                historyItem.question;
            
            historyCard.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="
                        background: var(--tg-theme-hint-color);
                        color: var(--tg-theme-bg-color);
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        font-weight: 600;
                        flex-shrink: 0;
                        margin-top: 2px;
                        opacity: 0.8;
                    ">📜</div>
                    <div style="
                        color: var(--tg-theme-text-color);
                        font-size: 15px;
                        line-height: 1.4;
                        flex: 1;
                    ">${questionText}</div>
                </div>
            `;
            
            historyCard.onclick = () => {
                showHistoryDetail(historyItem);
            };
            
            previousList.appendChild(historyCard);
        });
        
        previousContainer.classList.remove('hidden');
        
    } catch (error) {
        console.error('Ошибка загрузки предыдущих вопросов:', error);
        previousContainer.classList.add('hidden');
    }
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    console.log('👤 Загружаем профиль пользователя...');
    
    try {
        const userId = getUserId();
        console.log('🔑 User ID для загрузки профиля:', userId);
        
        if (!userId || userId === 'guest') {
            console.warn('⚠️ User ID не определен или является guest, используем пустой профиль');
            AppState.profile = { role: '', specialization: '' };
            return;
        }
        
        const profileUrl = `${CONFIG.API_BASE_URL}/profile/${userId}`;
        console.log('🌐 URL для загрузки профиля:', profileUrl);
        
        const response = await fetch(profileUrl);
        console.log('📊 Статус ответа профиля:', response.status);
        
        if (response.ok) {
            const profile = await response.json();
            console.log('✅ Профиль загружен из БД:', profile);
            
            AppState.profile = profile;
            
            // Проверяем, что профиль корректно установлен
            console.log('📋 Финальное состояние AppState.profile:', AppState.profile);
            
            // Если профиль пустой, показываем предупреждение
            if (!profile.role || !profile.specialization) {
                console.warn('⚠️ Профиль пользователя не настроен в БД');
                console.warn('📝 Рекомендуется пройти онбординг в Telegram боте или настроить профиль в мини-приложении');
            }
        } else {
            const errorText = await response.text();
            console.error('❌ Ошибка API загрузки профиля:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            
            // Устанавливаем пустой профиль при ошибке
            AppState.profile = { role: '', specialization: '' };
        }
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА загрузки профиля:', error);
        console.error('📋 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        
        // Устанавливаем пустой профиль при ошибке
        AppState.profile = { role: '', specialization: '' };
    }
}

// Загрузка ролей и специализаций
async function loadRolesAndSpecializations() {
    console.log('🔄 Загружаем роли и специализации...');
    console.log('📍 API_BASE_URL:', CONFIG.API_BASE_URL);
    
    try {
        console.log('🌐 Отправляем запросы к API...');
        const [rolesResponse, specsResponse] = await Promise.all([
            fetch(`${CONFIG.API_BASE_URL}/roles`),
            fetch(`${CONFIG.API_BASE_URL}/specializations`)
        ]);
        
        console.log('📊 Статусы ответов:', {
            roles: rolesResponse.status,
            specializations: specsResponse.status
        });
        
        if (rolesResponse.ok && specsResponse.ok) {
            roles = await rolesResponse.json();
            specializations = await specsResponse.json();
            
            console.log('✅ Роли загружены:', roles);
            console.log('✅ Специализации загружены:', specializations);
        } else {
            const rolesError = rolesResponse.ok ? null : await rolesResponse.text();
            const specsError = specsResponse.ok ? null : await specsResponse.text();
            
            console.error('❌ Ошибки API:', {
                rolesStatus: rolesResponse.status,
                rolesError: rolesError,
                specsStatus: specsResponse.status,
                specsError: specsError
            });
            
            throw new Error('Ошибка загрузки данных');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки ролей и специализаций:', error);
        console.error('📋 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        
        // Fallback данные
        roles = [
            { "value": "PO/PM", "label": "PO/PM" },
            { "value": "Лид компетенции", "label": "Лид компетенции" },
            { "value": "Специалист", "label": "Специалист" },
            { "value": "Стажер", "label": "Стажер" }
        ];
        
        specializations = [
            { "value": "Аналитик", "label": "Аналитик" },
            { "value": "Тестировщик", "label": "Тестировщик" },
            { "value": "WEB", "label": "WEB" },
            { "value": "Java", "label": "Java" },
            { "value": "Python", "label": "Python" }
        ];
        
        console.log('🔄 Используем fallback данные');
    }
}

async function loadQuestions() {
    console.log('📚 Загружаем вопросы...');
    console.log('👤 Текущий профиль:', AppState.profile);
    
    try {
        const role = AppState.profile.role || '';
        const specialization = AppState.profile.specialization || '';
        
        console.log('🎯 Параметры запроса:', { role, specialization });
        
        // Загружаем вопросы
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (specialization) params.append('specialization', specialization);
        
        const questionsUrl = `${CONFIG.API_BASE_URL}/questions${params.toString() ? '?' + params.toString() : ''}`;
        console.log('🌐 URL запроса вопросов:', questionsUrl);
        
        const questionsResponse = await fetch(questionsUrl);
        console.log('📊 Статус ответа вопросов:', questionsResponse.status);
        
        if (questionsResponse.ok) {
            AppState.allQuestions = await questionsResponse.json();
            AppState.questions = [...AppState.allQuestions]; // Копия для фильтрации
            
            console.log('✅ Вопросы загружены:', {
                count: AppState.allQuestions.length,
                questions: AppState.allQuestions
            });
        } else {
            const errorText = await questionsResponse.text();
            console.error('❌ Ошибка API вопросов:', {
                status: questionsResponse.status,
                statusText: questionsResponse.statusText,
                error: errorText
            });
            throw new Error(`Ошибка загрузки вопросов: ${questionsResponse.status}`);
        }
        
        // Загружаем категории
        console.log('📂 Загружаем категории...');
        try {
            const categoriesResponse = await fetch(`${CONFIG.API_BASE_URL}/questions/categories`);
            console.log('📊 Статус ответа категорий:', categoriesResponse.status);
            
            if (categoriesResponse.ok) {
                AppState.questionCategories = await categoriesResponse.json();
                console.log('✅ Категории загружены:', AppState.questionCategories);
            } else {
                const catErrorText = await categoriesResponse.text();
                console.warn('⚠️ Ошибка загрузки категорий:', {
                    status: categoriesResponse.status,
                    error: catErrorText
                });
                AppState.questionCategories = [];
            }
        } catch (categoriesError) {
            console.warn('⚠️ Исключение при загрузке категорий:', categoriesError);
            AppState.questionCategories = [];
        }
        
    } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА загрузки вопросов:', error);
        console.error('📋 Детали ошибки:', {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        });
        
        AppState.questions = [];
        AppState.allQuestions = [];
        AppState.questionCategories = [];
        
        console.log('🔄 Устанавливаем пустые массивы для вопросов');
    }
    
    console.log('📊 Финальное состояние вопросов:', {
        allQuestions: AppState.allQuestions.length,
        filteredQuestions: AppState.questions.length,
        categories: AppState.questionCategories.length
    });
}

// Загрузка истории
async function loadHistory() {
    try {
        const userId = getUserId();
        const response = await fetch(`${CONFIG.API_BASE_URL}/history/${userId}`);
        
        if (response.ok) {
            AppState.history = await response.json();
        } else {
            throw new Error('Ошибка загрузки истории');
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        AppState.history = [];
    }
}

function showAlert(message) {
    if (tg && tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// Лоадеры
function showLoader() {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        loader.innerHTML = '<div class="spinner" style="width: 40px; height: 40px;"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Функция показа кастомного модального окна подтверждения
function showConfirmationModal(title, message, onConfirm) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--tg-theme-bg-color);
        border-radius: 12px;
        padding: 24px;
        max-width: 320px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease-out;
    `;
    
    modalContent.innerHTML = `
        <h3 style="
            color: var(--tg-theme-text-color);
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            text-align: center;
        ">${title}</h3>
        <p style="
            color: var(--tg-theme-subtitle-text-color);
            margin: 0 0 24px 0;
            font-size: 14px;
            line-height: 1.4;
            text-align: center;
        ">${message}</p>
        <div style="
            display: flex;
            gap: 12px;
            justify-content: center;
        ">
            <button id="modal-cancel" style="
                background: var(--tg-theme-secondary-bg-color);
                color: var(--tg-theme-text-color);
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 80px;
            ">Отмена</button>
            <button id="modal-confirm" style="
                background: var(--tg-theme-destructive-text-color, #ff3b30);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 80px;
            ">Удалить</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Добавляем стили для анимации
    if (!document.getElementById('modal-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-animation-styles';
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: scale(0.9) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Обработчики кнопок
    const cancelButton = modalContent.querySelector('#modal-cancel');
    const confirmButton = modalContent.querySelector('#modal-confirm');
    
    const closeModal = () => {
        modalContent.style.animation = 'modalSlideIn 0.2s ease-in reverse';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 200);
    };
    
    cancelButton.onclick = closeModal;
    confirmButton.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
    };
    
    // Закрытие по клику на фон
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
        }
    };
    
    // Hover эффекты для кнопок
    [cancelButton, confirmButton].forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    });
}

// Функция для получения корректного user_id
function getUserId() {
    console.log('🔍 Определяем user_id...');
    
    // Сначала пытаемся получить ID из Telegram
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
        console.log('✅ Используем Telegram user ID:', tg.initDataUnsafe.user.id);
        console.log('📊 Полные данные пользователя Telegram:', tg.initDataUnsafe.user);
        return tg.initDataUnsafe.user.id.toString();
    }
    
    // Если есть в AppState
    if (AppState.user && AppState.user.id) {
        console.log('✅ Используем AppState user ID:', AppState.user.id);
        console.log('📊 Полные данные AppState.user:', AppState.user);
        return AppState.user.id.toString();
    }
    
    // Попробуем получить из URL параметров (если мини-приложение запущено с параметрами)
    const urlParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = urlParams.get('user_id');
    if (userIdFromUrl) {
        console.log('✅ Используем user ID из URL:', userIdFromUrl);
        return userIdFromUrl;
    }
    
    // Попробуем получить из localStorage (если ранее сохранили)
    const savedUserId = localStorage.getItem('telegram_user_id');
    if (savedUserId) {
        console.log('✅ Используем сохраненный user ID:', savedUserId);
        return savedUserId;
    }
    
    // Отладочная информация о доступных данных
    console.log('❌ Не удалось получить user_id. Отладочная информация:');
    console.log('- tg объект:', tg);
    console.log('- tg.initDataUnsafe:', tg?.initDataUnsafe);
    console.log('- AppState.user:', AppState.user);
    console.log('- URL параметры:', window.location.search);
    console.log('- localStorage telegram_user_id:', localStorage.getItem('telegram_user_id'));
    
    console.warn('⚠️ Используем fallback: guest');
    return 'guest';
}

// Функция для сохранения user_id в localStorage
function saveUserId(userId) {
    if (userId && userId !== 'guest') {
        localStorage.setItem('telegram_user_id', userId);
        console.log('User ID сохранен в localStorage:', userId);
    }
}

// Функция для тестирования Markdown парсинга (для отладки)
function testMarkdownParsing() {
    const testText = `# Заголовок 1
## Заголовок 2  
### Middle-аналитик
Обычный текст после заголовка третьего уровня.

- Пункт списка 1
- Пункт списка 2

**Жирный текст** и *курсив*.`;

    console.log('🧪 Тестируем Markdown парсинг:');
    console.log('Исходный текст:', testText);
    
    const formatted = formatAnswerText(testText);
    console.log('После formatAnswerText:', formatted);
    
    const html = convertMarkdownToHtml(formatted);
    console.log('После convertMarkdownToHtml:', html);
    
    return html;
}



// Функция для тестирования парсинга Markdown
function testMarkdownParsing() {
    const testText = `# Ожидания от Лида Компетенции

## Product Owner (PO):

### Middle-аналитик

- Проведение анализа текущих процессов
- Создание диаграмм и моделей
- Помощь в формулировке требований

### Senior-аналитик

- Владение стратегиями тестирования
- Опыт работы с командой

## Системный аналитик

1. Формулирование технических требований
2. Проектирование решений
3. Работа с архитектурой системы`;

    console.log('🧪 Тестируем парсинг Markdown:');
    console.log('Исходный текст:', testText);
    
    const result = convertMarkdownToHtml(testText);
    console.log('Результат:', result);
    
    // Показываем результат в интерфейсе
    const container = document.getElementById('chat-container');
    if (container) {
        const testDiv = document.createElement('div');
        testDiv.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    ${result}
            </div>
        </div>
    `;
        container.appendChild(testDiv);
        container.scrollTop = container.scrollHeight;
    }
}

// Добавляем тестовые функции в глобальную область для отладки
window.testMarkdownParsing = testMarkdownParsing;

// Функция для постобработки ответа от RAG
function postProcessAnswer(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    console.log('🔧 Постобработка ответа...');
    
    let processed = text;
    
    // 1. Исправляем неправильные символы заголовков в середине текста
    // Заменяем "###" без пробела на обычный текст
    processed = processed.replace(/([^\n])###([^\s])/g, '$1$2');
    
    // Заменяем "##" без пробела на обычный текст  
    processed = processed.replace(/([^\n])##([^\s])/g, '$1$2');
    
    // 2. Исправляем заголовки без пробелов
    // Добавляем пробел после # если его нет
    processed = processed.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
    
    // 3. Добавляем пустые строки после заголовков если их нет
    processed = processed.replace(/^(#{1,6}\s+.+)$/gm, '$1\n');
    
    // 4. Исправляем списки без пробелов
    // Добавляем пробел после цифры с точкой
    processed = processed.replace(/^(\d+\.)([^\s])/gm, '$1 $2');
    
    // Добавляем пробел после тире
    processed = processed.replace(/^([-*])([^\s])/gm, '$1 $2');
    
    // ИСПРАВЛЕНИЕ: Убираем лишние символы -- 
    // Убираем строки содержащие только --
    processed = processed.replace(/^--\s*$/gm, '');
    
    // Заменяем -- в начале строк на маркеры списков -
    processed = processed.replace(/^--\s+/gm, '- ');
    
    // Убираем символы -- в середине текста (заменяем на обычный текст)
    processed = processed.replace(/\s--\s/g, ' ');
    
    // Убираем -- как разделители между абзацами
    processed = processed.replace(/\n--\n/g, '\n\n');
    
    // 5. Убираем лишние пустые строки (более 2 подряд)
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    // 6. Исправляем структуру: добавляем пустые строки между разными типами блоков
    // После заголовков перед списками
    processed = processed.replace(/^(#{1,6}\s+.+)\n([-*\d])/gm, '$1\n\n$2');
    
    // После списков перед заголовками
    processed = processed.replace(/^([-*\d].+)\n(#{1,6}\s)/gm, '$1\n\n$2');
    
    // После обычного текста перед заголовками
    processed = processed.replace(/^([^#\n-*\d].+)\n(#{1,6}\s)/gm, '$1\n\n$2');
    
    console.log('✅ Постобработка завершена');
    return processed.trim();
} 