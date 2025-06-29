```json
{
  "role": "intern",
  "specialty": "python_developer",
  "document_type": "best_practices_guide",
  "tags": ["intern", "python_developer", "python_best_practices", "clean_code", "design_patterns", "performance", "security", "стажер", "python_разработчик", "лучшие_практики_python", "чистый_код", "паттерны_проектирования", "производительность", "безопасность"],
  "chunk_id": 1
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: python_developer; ТЕМА: основы_лучших_практик_python_разработки_для_стажера

# Лучшие практики Python разработки для стажера

## Введение в лучшие практики для стажера

### Что такое лучшие практики:
Лучшие практики Python разработки — это проверенные временем подходы, принципы и рекомендации, которые помогают писать качественный, поддерживаемый и эффективный код.

### Почему важно следовать лучшим практикам стажеру:
- **Читаемость кода**: Понятность для других разработчиков в команде
- **Поддерживаемость**: Легкость внесения изменений и исправления багов
- **Производительность**: Оптимальная работа приложений
- **Безопасность**: Защита от уязвимостей и атак
- **Масштабируемость**: Возможность роста системы
- **Карьерный рост**: Демонстрация профессиональных навыков

### Основные принципы для стажера:
1. **SOLID принципы**: Основа объектно-ориентированного программирования
2. **DRY (Don't Repeat Yourself)**: Избежание дублирования кода
3. **KISS (Keep It Simple, Stupid)**: Простота решений
4. **YAGNI (You Aren't Gonna Need It)**: Не добавлять функциональность заранее
5. **PEP 8**: Стиль кодирования Python
6. **Zen of Python**: Философия Python

## Принципы SOLID для стажера

### Single Responsibility Principle (SRP):
**Класс должен иметь только одну причину для изменения**

#### Пример нарушения для стажера:
```python
class UserService:
    def create_user(self, user):
        # создание пользователя
        pass
    
    def send_email(self, to, subject):
        # отправка email
        pass
    
    def generate_report(self):
        # генерация отчета
        pass
```

#### Правильная реализация для стажера:
```python
class UserService:
    def create_user(self, user):
        # создание пользователя
        pass

class EmailService:
    def send_email(self, to, subject):
        # отправка email
        pass

class ReportService:
    def generate_report(self):
        # генерация отчета
        pass
```

### Open/Closed Principle (OCP):
**Программные сущности должны быть открыты для расширения, но закрыты для модификации**

#### Пример для стажера:
```python
from abc import ABC, abstractmethod

class PaymentProcessor(ABC):
    @abstractmethod
    def process_payment(self, payment):
        pass

class CreditCardProcessor(PaymentProcessor):
    def process_payment(self, payment):
        # обработка картой
        pass

class PayPalProcessor(PaymentProcessor):
    def process_payment(self, payment):
        # обработка PayPal
        pass
```

---

```json
{
  "role": "intern",
  "specialty": "python_developer",
  "document_type": "best_practices_guide",
  "tags": ["intern", "python_developer", "clean_code", "naming_conventions", "code_structure", "documentation", "стажер", "python_разработчик", "чистый_код", "соглашения_по_именованию", "структура_кода", "документация"],
  "chunk_id": 2
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: python_developer; ТЕМА: чистый_код_и_соглашения_по_именованию_для_стажера

## Чистый код и соглашения по именованию для стажера

### Принципы чистого кода для стажера:

#### 1. Осмысленные имена
- **Переменные**: Описывают что содержат
- **Функции**: Описывают что делают
- **Классы**: Описывают что представляют

#### Примеры хороших имен для стажера:
```python
# Плохо
d = 30  # время в днях
l = []  # список пользователей

# Хорошо
days_since_creation = 30
active_users = []
```

#### 2. Функции должны быть маленькими
- **Максимум 20 строк**
- **Одна функция — одна задача**
- **Понятные имена функций**

#### Пример рефакторинга для стажера:
```python
# Плохо
def process_order(order):
    if order and order.items and len(order.items) > 0:
        for item in order.items:
            if item.price > 0:
                # 50+ строк логики
                pass

# Хорошо
def process_order(order):
    if not is_valid_order(order):
        return
    
    for item in order.items:
        process_item(item)

def is_valid_order(order):
    return order and order.items and len(order.items) > 0

def process_item(item):
    if item.price > 0:
        # логика обработки
        pass
```

### Соглашения по именованию в Python (PEP 8) для стажера:

#### Классы:
- **PascalCase**: `UserService`, `PaymentProcessor`
- **Существительные**: `User`, `Order`, `EmailService`

#### Функции и переменные:
- **snake_case**: `get_user_by_id()`, `calculate_total()`
- **Глаголы для функций**: `create`, `update`, `delete`, `calculate`

#### Константы:
- **UPPER_SNAKE_CASE**: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`

#### Модули и пакеты:
- **snake_case**: `user_service.py`, `payment_processor.py`

### Документация кода для стажера:

#### Docstrings для функций:
```python
def calculate_total_price(items: List[Item]) -> float:
    """
    Рассчитывает общую стоимость товаров.
    
    Args:
        items: Список товаров для расчета
        
    Returns:
        float: Общая стоимость товаров
        
    Raises:
        ValueError: Если список товаров пуст
    """
    if not items:
        raise ValueError("Список товаров не может быть пустым")
    
    return sum(item.price for item in items)
```

#### Комментарии в коде:
```python
# Хорошо - объясняет почему, а не что
def process_payment(payment):
    # Проверяем статус платежа перед обработкой
    # для избежания двойной обработки
    if payment.status == 'processed':
        return
    
    # Логика обработки платежа
    payment.process()
```

---

```json
{
  "role": "intern",
  "specialty": "python_developer",
  "document_type": "best_practices_guide",
  "tags": ["intern", "python_developer", "design_patterns", "creational_patterns", "structural_patterns", "behavioral_patterns", "стажер", "python_разработчик", "паттерны_проектирования", "порождающие_паттерны", "структурные_паттерны", "поведенческие_паттерны"],
  "chunk_id": 3
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: python_developer; ТЕМА: паттерны_проектирования_в_python_для_стажера

## Паттерны проектирования в Python для стажера

### Классификация паттернов для стажера:

#### 1. Порождающие паттерны (Creational Patterns)

##### Singleton (Одиночка) для стажера:
```python
class DatabaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.connection = self._create_connection()
            self.initialized = True
    
    def _create_connection(self):
        # логика создания соединения
        pass
```

##### Factory Method для стажера:
```python
from abc import ABC, abstractmethod

class Animal(ABC):
    @abstractmethod
    def make_sound(self):
        pass

class Dog(Animal):
    def make_sound(self):
        return "Woof!"

class Cat(Animal):
    def make_sound(self):
        return "Meow!"

class AnimalFactory:
    @staticmethod
    def create_animal(animal_type: str) -> Animal:
        if animal_type == "dog":
            return Dog()
        elif animal_type == "cat":
            return Cat()
        else:
            raise ValueError(f"Unknown animal type: {animal_type}")
```

#### 2. Структурные паттерны (Structural Patterns)

##### Adapter для стажера:
```python
class OldPaymentSystem:
    def process_payment_old(self, amount, currency):
        return f"Processed {amount} {currency} with old system"

class NewPaymentSystem:
    def process_payment(self, payment_data):
        return f"Processed {payment_data['amount']} {payment_data['currency']} with new system"

class PaymentAdapter:
    def __init__(self, new_system: NewPaymentSystem):
        self.new_system = new_system
    
    def process_payment_old(self, amount, currency):
        payment_data = {'amount': amount, 'currency': currency}
        return self.new_system.process_payment(payment_data)
```

##### Decorator для стажера:
```python
class Coffee:
    def cost(self):
        return 10
    
    def description(self):
        return "Simple coffee"

class MilkDecorator:
    def __init__(self, coffee):
        self.coffee = coffee
    
    def cost(self):
        return self.coffee.cost() + 2
    
    def description(self):
        return self.coffee.description() + ", milk"

class SugarDecorator:
    def __init__(self, coffee):
        self.coffee = coffee
    
    def cost(self):
        return self.coffee.cost() + 1
    
    def description(self):
        return self.coffee.description() + ", sugar"
```

#### 3. Поведенческие паттерны (Behavioral Patterns)

##### Observer для стажера:
```python
from abc import ABC, abstractmethod

class Observer(ABC):
    @abstractmethod
    def update(self, message):
        pass

class Subject:
    def __init__(self):
        self._observers = []
    
    def attach(self, observer: Observer):
        self._observers.append(observer)
    
    def detach(self, observer: Observer):
        self._observers.remove(observer)
    
    def notify(self, message):
        for observer in self._observers:
            observer.update(message)

class EmailNotifier(Observer):
    def update(self, message):
        print(f"Sending email: {message}")

class SMSNotifier(Observer):
    def update(self, message):
        print(f"Sending SMS: {message}")
```

---

```json
{
  "role": "intern",
  "specialty": "python_developer",
  "document_type": "best_practices_guide",
  "tags": ["intern", "python_developer", "performance_optimization", "memory_management", "profiling", "caching", "стажер", "python_разработчик", "оптимизация_производительности", "управление_памятью", "профилирование", "кэширование"],
  "chunk_id": 4
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: python_developer; ТЕМА: оптимизация_производительности_для_стажера

## Оптимизация производительности для стажера

### Основы оптимизации для стажера:

#### 1. Профилирование кода
**Инструменты профилирования:**
- **cProfile**: Встроенный профилировщик Python
- **line_profiler**: Профилирование по строкам
- **memory_profiler**: Профилирование использования памяти

#### Пример профилирования для стажера:
```python
import cProfile
import pstats

def slow_function():
    result = 0
    for i in range(1000000):
        result += i
    return result

# Профилирование
profiler = cProfile.Profile()
profiler.enable()
slow_function()
profiler.disable()

# Анализ результатов
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)
```

#### 2. Оптимизация циклов
**Избежание медленных операций в циклах:**
```python
# Плохо - медленно
def slow_sum(numbers):
    result = 0
    for num in numbers:
        result = result + num  # медленная операция
    return result

# Хорошо - быстро
def fast_sum(numbers):
    return sum(numbers)  # встроенная функция

# Еще лучше - генератор
def generator_sum(numbers):
    return sum(num for num in numbers)
```

#### 3. Использование генераторов
**Генераторы для экономии памяти:**
```python
# Плохо - загружает все в память
def get_large_list():
    return [i for i in range(1000000)]

# Хорошо - генератор
def get_large_generator():
    for i in range(1000000):
        yield i

# Использование
for item in get_large_generator():
    process_item(item)
```

### Кэширование для стажера:

#### 1. Простое кэширование
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

#### 2. Кэширование с TTL
```python
import time
from functools import wraps

def cache_with_ttl(ttl_seconds):
    def decorator(func):
        cache = {}
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            current_time = time.time()
            
            if key in cache:
                result, timestamp = cache[key]
                if current_time - timestamp < ttl_seconds:
                    return result
            
            result = func(*args, **kwargs)
            cache[key] = (result, current_time)
            return result
        
        return wrapper
    return decorator

@cache_with_ttl(300)  # кэш на 5 минут
def expensive_api_call(user_id):
    # имитация дорогого API вызова
    time.sleep(1)
    return f"User data for {user_id}"
```

### Оптимизация работы с базами данных для стажера:

#### 1. Избежание N+1 проблемы
```python
# Плохо - N+1 запросов
def get_users_with_orders_bad():
    users = User.objects.all()
    for user in users:
        orders = user.orders.all()  # дополнительный запрос для каждого пользователя
        print(f"{user.name}: {len(orders)} orders")

# Хорошо - 2 запроса
def get_users_with_orders_good():
    users = User.objects.prefetch_related('orders').all()
    for user in users:
        orders = user.orders.all()  # данные уже загружены
        print(f"{user.name}: {len(orders)} orders")
```

#### 2. Использование select_related
```python
# Плохо - отдельный запрос для каждого заказа
def get_orders_with_user_bad():
    orders = Order.objects.all()
    for order in orders:
        print(f"Order {order.id} by {order.user.name}")

# Хорошо - один запрос с JOIN
def get_orders_with_user_good():
    orders = Order.objects.select_related('user').all()
    for order in orders:
        print(f"Order {order.id} by {order.user.name}")
```

---

```json
{
  "role": "intern",
  "specialty": "python_developer",
  "document_type": "best_practices_guide",
  "tags": ["intern", "python_developer", "security_best_practices", "input_validation", "authentication", "authorization", "стажер", "python_разработчик", "лучшие_практики_безопасности", "валидация_ввода", "аутентификация", "авторизация"],
  "chunk_id": 5
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: python_developer; ТЕМА: безопасность_в_python_для_стажера

## Безопасность в Python для стажера

### Основы безопасности для стажера:

#### 1. Валидация входных данных
**Всегда проверяйте входные данные:**
```python
import re
from typing import Optional

def validate_email(email: str) -> bool:
    """Валидация email адреса"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password: str) -> bool:
    """Валидация пароля"""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True

def sanitize_input(user_input: str) -> str:
    """Очистка пользовательского ввода"""
    # Удаляем потенциально опасные символы
    dangerous_chars = ['<', '>', '"', "'", '&']
    for char in dangerous_chars:
        user_input = user_input.replace(char, '')
    return user_input
```

#### 2. Безопасная работа с паролями
**Используйте хеширование паролей:**
```python
import hashlib
import os
import bcrypt

def hash_password(password: str) -> str:
    """Хеширование пароля с солью"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

# Пример использования
password = "my_secure_password"
hashed = hash_password(password)
print(f"Hashed password: {hashed}")

is_valid = verify_password(password, hashed)
print(f"Password valid: {is_valid}")
```

#### 3. Защита от SQL инъекций
**Используйте параметризованные запросы:**
```python
import sqlite3

# Плохо - уязвимо к SQL инъекциям
def get_user_bad(username):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    return cursor.fetchone()

# Хорошо - безопасно
def get_user_good(username):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE username = ?"
    cursor.execute(query, (username,))
    return cursor.fetchone()

# С Django ORM - автоматически безопасно
def get_user_django(username):
    return User.objects.filter(username=username).first()
```

### Аутентификация и авторизация для стажера:

#### 1. JWT токены
```python
import jwt
import datetime
from typing import Optional

SECRET_KEY = "your-secret-key"

def create_jwt_token(user_id: int, username: str) -> str:
    """Создание JWT токена"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_jwt_token(token: str) -> Optional[dict]:
    """Проверка JWT токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError:
        print("Invalid token")
        return None
```

#### 2. Декоратор для проверки авторизации
```python
from functools import wraps
from flask import request, jsonify

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        # Убираем 'Bearer ' из токена
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid token'}), 401
        
        # Добавляем информацию о пользователе в request
        request.user = payload
        return f(*args, **kwargs)
    
    return decorated_function

# Использование
@app.route('/protected')
@require_auth
def protected_route():
    user_id = request.user['user_id']
    return jsonify({'message': f'Hello user {user_id}'})
```

### Защита от XSS атак для стажера:

#### 1. Экранирование HTML
```python
import html

def escape_html(text: str) -> str:
    """Экранирование HTML символов"""
    return html.escape(text)

# Пример
user_input = "<script>alert('XSS')</script>"
safe_text = escape_html(user_input)
print(safe_text)  # &lt;script&gt;alert('XSS')&lt;/script&gt;
```

#### 2. Валидация файлов
```python
import os
from typing import List

ALLOWED_EXTENSIONS = {'.txt', '.pdf', '.doc', '.docx'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file(file_path: str) -> bool:
    """Валидация загружаемого файла"""
    # Проверка расширения
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    # Проверка размера
    if os.path.getsize(file_path) > MAX_FILE_SIZE:
        return False
    
    return True
```

### Рекомендации по безопасности для стажера:

#### 1. Общие принципы:
- **Никогда не доверяйте пользовательскому вводу**
- **Всегда валидируйте данные**
- **Используйте HTTPS в продакшене**
- **Регулярно обновляйте зависимости**
- **Логируйте подозрительную активность**

#### 2. Работа с секретами:
```python
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

# Используем переменные окружения для секретов
DATABASE_URL = os.getenv('DATABASE_URL')
SECRET_KEY = os.getenv('SECRET_KEY')
API_KEY = os.getenv('API_KEY')
```

#### 3. Логирование безопасности:
```python
import logging

# Настройка логгера для безопасности
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

def log_security_event(event_type: str, details: str):
    """Логирование событий безопасности"""
    security_logger.warning(f"Security event: {event_type} - {details}")

# Пример использования
log_security_event("Failed login", f"User: {username}, IP: {ip_address}")
```

### Заключение для стажера:

Безопасность — критически важный аспект разработки. Как стажер, вы должны:
1. **Изучать основы безопасности** с самого начала
2. **Применять лучшие практики** в каждом проекте
3. **Тестировать безопасность** вашего кода
4. **Следить за обновлениями** и уязвимостями
5. **Консультироваться с опытными разработчиками** по вопросам безопасности

Помните: безопасность — это не дополнительная функция, а неотъемлемая часть качественного кода. 