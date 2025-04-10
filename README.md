## Тип проекта 
**RAG** (Retrieval-Augmented Generation) агент, реализованный как **Telegram**-бот.

Проект является полноценным решением для **RAG** с использованием современных технологий, разделен на логические компоненты и использует популярные библиотеки для работы с **LLM** и векторными базами данных.

## Архитектура
- Проект использует **микросервисную архитектуру** с отдельными компонентами для бота и RAG сервиса
- Компоненты запускаются **параллельно** через **main.py**
- Есть система мониторинга через **monitor.py**

## Структура проекта
- **src/main_version/** - основной код
```
├── main.py           # Точка входа, запускающая бота и RAG сервис
├── rag_service.py    # RAG сервис для обработки запросов
├── telegram_bot.py   # Telegram бот для взаимодействия с пользователями
├── monitor.py        # Мониторинг работы системы
└── requirements.txt  # Зависимости проекта
```
- **src/bot/** - дополнительные компоненты бота и тесты
- **src/config/** - конфигурационные файлы
- **src/scripts/** - вспомогательные скрипты

## Техстек и зависимости
Проект использует следующие основные библиотеки:
- **telebot** - для работы с Telegram API
- **python-dotenv** - для управления переменными окружения
- **asyncio, websockets** - для асинхронного взаимодействия
- **fastapi, uvicorn** - для создания веб-сервиса
- **faiss-cpu** - для векторного поиска на базе **FAISS**
- **langchain_community, langchain_gigachat, langchain_huggingface** - для интеграции с языковыми моделями
- **sentence-transformers** - для эмбеддингов и обработки текста

## Установка
1. Клонируйте репозиторий
2. Установите зависимости:
```bash
pip install -r requirements.txt
```

## Запуск
Для запуска всей системы используйте команду:
```bash
python main.py
```
