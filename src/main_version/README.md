# Документация по скрипту автоматического развертывания Docker-окружения

## Назначение

Скрипт предназначен для автоматизированного развертывания Docker-окружения, настройки базы данных SQLite и организации резервного копирования на Яндекс.Диск. Разработан для быстрой инициализации рабочей среды с минимальным вмешательством пользователя.

## Предварительные требования

Перед запуском скрипта необходимо обеспечить наличие:

1. **Программное обеспечение**:
   - Docker
   - Docker Compose

2. **Файлы**:
   - `id_ed25519` - приватный SSH-ключ
   - `id_ed25519.pub` - публичный SSH-ключ
   - `.env` - файл с переменными окружения для Яндекс.Диска

3. **Права доступа**:
   - Права суперпользователя (sudo)

## Принцип работы

Скрипт выполняет последовательно следующие операции:

### 1. Подготовительная проверка

- Проверяет наличие Docker и Docker Compose
- Проверяет наличие прав суперпользователя
- Проверяет наличие необходимых файлов (SSH-ключи, .env)

### 2. Подготовка рабочей среды

- Создает директории `rag_service2` и `monitor2`, если они отсутствуют
- Копирует SSH-ключи и файл .env в соответствующие директории

### 3. Развертывание Docker-контейнеров

- Запускает `docker-compose up -d --build` для сборки и запуска контейнеров в фоновом режиме
- Ожидает запуска контейнеров
- Проверяет статус контейнеров командой `docker-compose ps`

### 4. Инициализация базы данных

- Создает директорию `sqlite_data_rag` для хранения базы данных SQLite
- Создает базу данных `AI_Agent.db`
- Создает в базе данных таблицу `Reminder` со следующей структурой:
  ```sql
  CREATE TABLE IF NOT EXISTS Reminder (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      reminder_time TEXT NOT NULL
  );
  ```

### 5. Настройка Яндекс.Диска

- Проверяет, установлен ли Яндекс.Диск, и устанавливает его при необходимости
- Запускает процесс настройки Яндекс.Диска с авторизацией пользователя
- Запускает демон Яндекс.Диска, если он не был запущен

### 6. Настройка резервного копирования

- Настраивает cron-задачи для выполнения резервного копирования:
  - Каждые 5 минут с сохранением копий за последние 20 минут
  - Ежедневно с сохранением копий за последние 7 дней
- Создает механизм блокировки для предотвращения конфликтов при одновременном резервном копировании
- Выполняет первоначальное резервное копирование

### 7. Настройка времени

- Устанавливает часовой пояс Москвы (UTC+3)
- Синхронизирует время с NTP-сервером

## Структура резервного копирования

### Периодичность и хранение

1. **Кратковременные копии (каждые 5 минут)**
   - Формат имени файла: `AI_Agent_YYYY-MM-DD_HH-MM.db`
   - Хранятся в течение 20 минут
   - Предназначены для восстановления при внезапном отказе системы

2. **Долговременные копии (ежедневно)**
   - Формат имени файла: `AI_Agent_YYYY-MM-DD.db`
   - Хранятся в течение 7 дней
   - Предназначены для восстановления данных за предыдущие дни

### Механизм блокировки

Для предотвращения конфликтов при одновременном резервном копировании используется файл блокировки `.lock` в директории с базой данных. Блокировка создается перед началом копирования и удаляется после его завершения.

## Мониторинг и управление

### Проверка статуса Docker-контейнеров

```bash
docker-compose ps
```

### Просмотр логов Docker-контейнеров

```bash
docker-compose logs -f
```

### Проверка статуса Яндекс.Диска

```bash
yandex-disk status
```

### Проверка cron-задач

```bash
crontab -l
```

## Устранение неисправностей

### Docker и Docker Compose

**Проблема**: Docker или Docker Compose не установлены

**Решение**: Установите Docker и Docker Compose согласно официальной документации:
- Docker: https://docs.docker.com/engine/install/
- Docker Compose: https://docs.docker.com/compose/install/

### SSH-ключи и .env файл

**Проблема**: Отсутствуют SSH-ключи или файл .env

**Решение**: 
- Для создания SSH-ключей выполните: `ssh-keygen -t ed25519`
- Создайте файл .env с необходимыми переменными окружения

### Яндекс.Диск

**Проблема**: Не удается авторизоваться в Яндекс.Диске

**Решение**:
1. Проверьте интернет-соединение
2. Перезапустите процесс настройки: `yandex-disk setup`
3. Убедитесь, что вы правильно ввели код авторизации с https://ya.ru/device

### Резервное копирование

**Проблема**: Резервное копирование не выполняется

**Решение**:
1. Проверьте, что cron-задачи настроены: `crontab -l`
2. Проверьте права доступа к директориям и файлам
3. Проверьте наличие свободного места на диске

## Пример использования

1. Поместите файлы `id_ed25519`, `id_ed25519.pub` и `.env` в рабочую директорию
2. Запустите скрипт с правами суперпользователя:
   ```bash
   sudo ./deploy.sh
   ```
3. Следуйте инструкциям для авторизации в Яндекс.Диске
4. Дождитесь завершения настройки и запуска всех компонентов

## Безопасность

- SSH-ключи и файл .env содержат токены, которые должны храниться в безопасном месте
- Скрипт требует прав суперпользователя, что предполагает высокий уровень доверия к его содержимому
- Резервные копии базы данных хранятся на Яндекс.Диске, что обеспечивает дополнительную защиту от потери данных
