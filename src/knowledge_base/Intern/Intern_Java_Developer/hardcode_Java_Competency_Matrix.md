{
  "role": "intern",
  "specialty": "java_developer",
  "document_type": "competency_matrix",
  "tags": ["intern", "java_developer", "competency_matrix", "skills_assessment", "career_growth", "стажер", "java_разработчик", "матрица_компетенций", "оценка_навыков", "карьерный_рост"],
  "chunk_id": 1
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: java_developer; ТЕМА: матрица_компетенций_стажера_java_разработчика

# Матрица компетенций стажера Java разработчика

## Общие компетенции стажера Java разработчика

### Soft Skills (мягкие навыки)

#### 1. Желание учиться, подтверждаемое делом (1-5 баллов)
**Критерии оценки:**
- **1 балл**: Пассивное обучение, ожидание указаний
- **2 балла**: Базовое изучение материалов по запросу
- **3 балла**: Активное изучение новых технологий Java
- **4 балла**: Инициативное изучение и применение знаний
- **5 баллов**: Лидерство в обучении, менторство других

**Примеры для стажера Java разработчика:**
- Изучение Spring Boot без указания ментора
- Создание pet-проектов для практики
- Чтение технической литературы по Java
- Участие в технических meetups и конференциях

#### 2. Проактивная работа с ментором (1-5 баллов)
**Критерии оценки:**
- **1 балл**: Ожидание инициативы от ментора
- **2 балла**: Реакция на запросы ментора
- **3 балла**: Регулярные инициативные встречи
- **4 балла**: Подготовка вопросов и планов развития
- **5 баллов**: Самостоятельное планирование карьеры

**Примеры для стажера Java разработчика:**
- Инициативные вопросы о архитектуре приложения
- Предложение технических решений
- Запрос обратной связи по коду
- Планирование изучения новых технологий

#### 3. Командная работа (1-5 баллов)
**Критерии оценки:**
- **1 балл**: Индивидуальная работа, минимальное взаимодействие
- **2 балла**: Базовое участие в командных процессах
- **3 балла**: Активное участие в командной работе
- **4 балла**: Помощь коллегам и инициативность
- **5 баллов**: Лидерство в командных процессах

**Примеры для стажера Java разработчика:**
- Участие в daily standups
- Помощь в code review коллег
- Делиться изученными материалами
- Участие в парном программировании

### Hard Skills (технические навыки)

#### 1. Java Core (1-5 баллов)
**Критерии оценки:**
- **1 балл**: Базовые знания синтаксиса Java
- **2 балла**: Понимание ООП принципов
- **3 балла**: Уверенное использование коллекций и исключений
- **4 балла**: Знание многопоточности и Stream API
- **5 баллов**: Экспертиза в Java, знание внутренностей JVM

**Конкретные навыки:**
- Типы данных и переменные
- Коллекции (List, Set, Map)
- ООП (наследование, инкапсуляция, полиморфизм)
- Исключения и их обработка
- Многопоточность (Thread, Runnable, ExecutorService)
- Stream API и функциональное программирование
- Дженерики и рефлексия

#### 2. Spring Framework (1-5 баллов)
**Критерии оценки:**
- **1 балл**: Базовое понимание Spring Boot
- **2 балла**: Создание простых REST API
- **3 балла**: Уверенная работа с Spring Data и Security
- **4 балла**: Знание архитектурных паттернов Spring
- **5 баллов**: Экспертиза в Spring, создание кастомных компонентов

**Конкретные навыки:**
- Spring Core (DI, IoC)
- Spring Boot (auto-configuration, starter dependencies)
- Spring Data (JPA, Hibernate, Repository pattern)
- Spring Security (аутентификация, авторизация, JWT)
- Spring Web (REST API, контроллеры, валидация)

#### 3. Базы данных (1-5 баллов)
**Критерии оценки:**
- **1 балл**: Базовые SQL запросы
- **2 балла**: Работа с JPA/Hibernate
- **3 балла**: Проектирование схемы БД
- **4 балла**: Оптимизация запросов и производительности
- **5 баллов**: Экспертиза в БД, сложные запросы и миграции

**Конкретные навыки:**
- SQL (SELECT, INSERT, UPDATE, DELETE)
- JOIN операции (INNER, LEFT, RIGHT)
- JPA/Hibernate (Entity mapping, relationships)
- Индексы и их влияние на производительность
- Транзакции и их управление

---

```json
{
  "role": "intern",
  "specialty": "java_developer",
  "document_type": "competency_matrix",
  "tags": ["intern", "java_developer", "testing_skills", "tools_practices", "development_methodologies", "стажер", "java_разработчик", "навыки_тестирования", "инструменты_практики", "методологии_разработки"],
  "chunk_id": 2
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: java_developer; ТЕМА: продвинутые_навыки_стажера_java_разработчика

## Продвинутые навыки стажера Java разработчика

### Тестирование (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое понимание необходимости тестирования
- **2 балла**: Написание простых unit тестов
- **3 балла**: Уверенное использование JUnit и Mockito
- **4 балла**: Integration тестирование и TDD
- **5 баллов**: Экспертиза в тестировании, создание тестовых стратегий

#### Конкретные навыки:
- **Unit тестирование**: JUnit 5, написание тестов для методов
- **Mocking**: Mockito, создание моков и стабов
- **Integration тестирование**: Spring Boot Test, TestContainers
- **Test-Driven Development**: Цикл Red-Green-Refactor
- **Покрытие кода**: JaCoCo, целевые показатели покрытия

#### Примеры для стажера:
```java
// Unit тест
@Test
@DisplayName("Should create user successfully")
void createUser_WithValidData_ShouldReturnSavedUser() {
    // Arrange
    User user = new User("test@example.com", "Test User");
    when(userRepository.save(any(User.class))).thenReturn(user);
    
    // Act
    User createdUser = userService.createUser(user);
    
    // Assert
    assertNotNull(createdUser);
    assertEquals("test@example.com", createdUser.getEmail());
    verify(userRepository).save(user);
}
```

### Инструменты и практики разработки (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое использование Git
- **2 балла**: Уверенная работа с Git, участие в code review
- **3 балла**: Знание CI/CD, автоматизация процессов
- **4 балла**: Настройка инструментов разработки
- **5 баллов**: Экспертиза в DevOps практиках

#### Конкретные навыки:
- **Контроль версий**: Git, branching strategies, merge conflicts
- **Сборка проектов**: Maven/Gradle, управление зависимостями
- **CI/CD**: Jenkins, GitHub Actions, автоматизация тестов
- **Статический анализ**: SonarQube, SpotBugs, Checkstyle
- **Контейнеризация**: Docker, создание и использование контейнеров

#### Примеры для стажера:
```xml
<!-- Maven pom.xml -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
    </configuration>
</plugin>
```

### Методологии разработки (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое понимание Agile
- **2 балла**: Участие в Scrum процессах
- **3 балла**: Активное участие в планировании и ретроспективах
- **4 балла**: Фасилитация процессов, помощь команде
- **5 баллов**: Лидерство в методологических вопросах

#### Конкретные навыки:
- **Agile принципы**: Итеративная разработка, адаптация к изменениям
- **Scrum**: Роли, артефакты, события (Sprint Planning, Daily Standup, Retrospective)
- **Kanban**: Визуализация работы, ограничение WIP
- **User Stories**: Написание и оценка пользовательских историй
- **Estimation**: Story Points, Planning Poker

### Архитектура и дизайн (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое понимание архитектурных принципов
- **2 балла**: Применение простых паттернов проектирования
- **3 балла**: Понимание слоистой архитектуры
- **4 балла**: Проектирование микросервисов
- **5 баллов**: Архитектурное лидерство, принятие ключевых решений

#### Конкретные навыки:
- **Паттерны проектирования**: Singleton, Factory, Observer, Strategy
- **SOLID принципы**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Clean Architecture**: Разделение на слои, инверсия зависимостей
- **Микросервисы**: Разделение на сервисы, API Gateway, Service Discovery
- **Event-Driven Architecture**: Асинхронная обработка событий

#### Примеры для стажера:
```java
// Паттерн Strategy
public interface PaymentStrategy {
    void pay(BigDecimal amount);
}

public class CreditCardPayment implements PaymentStrategy {
    @Override
    public void pay(BigDecimal amount) {
        // реализация оплаты картой
    }
}

public class PayPalPayment implements PaymentStrategy {
    @Override
    public void pay(BigDecimal amount) {
        // реализация оплаты через PayPal
    }
}
```

---

```json
{
  "role": "intern",
  "specialty": "java_developer",
  "document_type": "competency_matrix",
  "tags": ["intern", "java_developer", "performance_optimization", "security", "monitoring", "стажер", "java_разработчик", "оптимизация_производительности", "безопасность", "мониторинг"],
  "chunk_id": 3
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: java_developer; ТЕМА: специализированные_навыки_стажера_java_разработчика

## Специализированные навыки стажера Java разработчика

### Производительность и оптимизация (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое понимание важности производительности
- **2 балла**: Простые оптимизации кода
- **3 балла**: Профилирование и анализ производительности
- **4 балла**: Оптимизация на уровне архитектуры
- **5 баллов**: Экспертиза в производительности, создание высоконагруженных систем

#### Конкретные навыки:
- **Профилирование**: JProfiler, VisualVM, анализ памяти и CPU
- **Оптимизация SQL**: Анализ планов выполнения, индексы
- **Кэширование**: Spring Cache, Redis, стратегии кэширования
- **Асинхронная обработка**: CompletableFuture, @Async
- **Connection pooling**: HikariCP, оптимизация подключений к БД

#### Примеры для стажера:
```java
// Кэширование с Spring
@Service
public class UserService {
    
    @Cacheable("users")
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
    
    @CacheEvict("users")
    public User updateUser(User user) {
        return userRepository.save(user);
    }
}

// Асинхронная обработка
@Service
public class EmailService {
    
    @Async
    public CompletableFuture<Void> sendWelcomeEmail(String email) {
        // отправка email
        return CompletableFuture.completedFuture(null);
    }
}
```

### Безопасность (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое понимание принципов безопасности
- **2 балла**: Применение базовых мер безопасности
- **3 балла**: Реализация аутентификации и авторизации
- **4 балла**: Защита от основных уязвимостей
- **5 баллов**: Экспертиза в безопасности, аудит безопасности

#### Конкретные навыки:
- **Аутентификация**: JWT токены, OAuth 2.0, Spring Security
- **Авторизация**: Role-based access control (RBAC)
- **Валидация данных**: Bean Validation, защита от инъекций
- **Шифрование**: Хеширование паролей, HTTPS
- **Аудит безопасности**: Логирование, мониторинг подозрительной активности

#### Примеры для стажера:
```java
// Spring Security конфигурация
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### Мониторинг и логирование (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое логирование
- **2 балла**: Структурированное логирование
- **3 балла**: Мониторинг приложения
- **4 балла**: Алерты и метрики
- **5 баллов**: Экспертиза в observability, создание систем мониторинга

#### Конкретные навыки:
- **Логирование**: SLF4J, Logback, структурированные логи
- **Метрики**: Micrometer, Prometheus, Grafana
- **Трейсинг**: Distributed tracing, Jaeger, Zipkin
- **Health checks**: Spring Boot Actuator
- **Алерты**: Настройка уведомлений о проблемах

#### Примеры для стажера:
```java
// Структурированное логирование
@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    public User createUser(User user) {
        logger.info("Creating new user", 
            Map.of("email", user.getEmail(), "name", user.getName()));
        
        try {
            User savedUser = userRepository.save(user);
            logger.info("User created successfully", 
                Map.of("userId", savedUser.getId()));
            return savedUser;
        } catch (Exception e) {
            logger.error("Failed to create user", 
                Map.of("email", user.getEmail()), e);
            throw new UserCreationException("Cannot create user", e);
        }
    }
}

// Health check
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    
    @Override
    public Health health() {
        try {
            // проверка подключения к БД
            return Health.up().build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .build();
        }
    }
}
```

### DevOps и развертывание (1-5 баллов)

#### Критерии оценки:
- **1 балл**: Базовое понимание процессов развертывания
- **2 балла**: Работа с Docker контейнерами
- **3 балла**: Настройка CI/CD pipeline
- **4 балла**: Управление инфраструктурой
- **5 баллов**: Экспертиза в DevOps, создание инфраструктуры как код

#### Конкретные навыки:
- **Контейнеризация**: Docker, создание Dockerfile
- **Оркестрация**: Kubernetes, управление подами и сервисами
- **CI/CD**: Jenkins, GitHub Actions, автоматизация деплоя
- **Infrastructure as Code**: Terraform, Ansible
- **Облачные платформы**: AWS, Azure, Google Cloud

#### Примеры для стажера:
```dockerfile
# Dockerfile для Java приложения
FROM openjdk:11-jre-slim

WORKDIR /app

COPY target/user-management-service.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

```yaml
# GitHub Actions workflow
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up JDK 11
      uses: actions/setup-java@v2
      with:
        java-version: '11'
    
    - name: Run tests
      run: mvn test
    
    - name: Build Docker image
      run: docker build -t user-service .
    
    - name: Deploy to staging
      run: |
        # деплой на staging окружение
```

---

```json
{
  "role": "intern",
  "specialty": "java_developer",
  "document_type": "competency_matrix",
  "tags": ["intern", "java_developer", "career_development", "learning_path", "assessment_criteria", "стажер", "java_разработчик", "карьерное_развитие", "путь_обучения", "критерии_оценки"],
  "chunk_id": 4
}
```

РОЛЬ: intern; СПЕЦИАЛЬНОСТЬ: java_developer; ТЕМА: карьерное_развитие_и_оценка_стажера_java_разработчика

## Карьерное развитие и оценка стажера Java разработчика

### Критерии оценки готовности к Junior позиции

#### Минимальные требования для перехода на Junior:
- **Java Core**: 3+ балла (уверенное использование коллекций, ООП, исключений)
- **Spring Framework**: 3+ балла (создание REST API, работа с Spring Data)
- **Базы данных**: 3+ балла (SQL, JPA/Hibernate, проектирование схемы)
- **Тестирование**: 3+ балла (unit тесты, JUnit, Mockito)
- **Инструменты**: 3+ балла (Git, Maven/Gradle, участие в code review)
- **Soft Skills**: 3+ балла (проактивность, командная работа, коммуникация)

#### Дополнительные преимущества:
- **Микросервисы**: Понимание принципов микросервисной архитектуры
- **Docker**: Умение создавать и использовать контейнеры
- **CI/CD**: Опыт работы с pipeline автоматизации
- **Безопасность**: Базовые знания Spring Security
- **Производительность**: Понимание принципов оптимизации

### План развития стажера Java разработчика

#### Месяц 1-2: Основы
**Цели:**
- Изучить Java Core (коллекции, ООП, исключения)
- Освоить Spring Boot основы
- Научиться работать с Git
- Понять принципы REST API

**Задачи:**
- Создать простое REST API с Spring Boot
- Написать unit тесты для основных методов
- Участвовать в code review
- Изучить документацию Spring

**Ожидаемые результаты:**
- Уверенное использование Java синтаксиса
- Создание простых Spring Boot приложений
- Базовые навыки работы с Git
- Понимание принципов тестирования

#### Месяц 3-4: Расширенные темы
**Цели:**
- Изучить Spring Data и работу с БД
- Освоить Spring Security
- Углубить знания тестирования
- Изучить принципы архитектуры

**Задачи:**
- Создать приложение с аутентификацией
- Написать integration тесты
- Изучить паттерны проектирования
- Участвовать в архитектурных обсуждениях

**Ожидаемые результаты:**
- Уверенная работа с базами данных
- Реализация аутентификации и авторизации
- Написание качественных тестов
- Понимание архитектурных принципов

#### Месяц 5-6: Продвинутые технологии
**Цели:**
- Изучить микросервисную архитектуру
- Освоить Docker и контейнеризацию
- Изучить CI/CD практики
- Подготовиться к Junior позиции

**Задачи:**
- Создать микросервисное приложение
- Настроить Docker контейнеры
- Создать CI/CD pipeline
- Подготовить портфолио проектов

**Ожидаемые результаты:**
- Понимание микросервисной архитектуры
- Умение работать с Docker
- Опыт настройки CI/CD
- Готовность к Junior позиции

### Методы оценки прогресса стажера

#### Техническая оценка:
- **Code review**: Регулярная оценка качества кода
- **Технические задачи**: Выполнение практических заданий
- **Тестирование знаний**: Проверка теоретических знаний
- **Портфолио проектов**: Оценка созданных проектов

#### Soft skills оценка:
- **Наблюдение**: Оценка поведения в команде
- **Обратная связь**: Отзывы коллег и ментора
- **Самооценка**: Рефлексия стажера о своем развитии
- **Интервью**: Регулярные встречи для оценки прогресса

#### Метрики успеха:
- **Выполнение задач**: Процент выполненных задач в срок
- **Качество кода**: Результаты статического анализа
- **Покрытие тестами**: Процент покрытия кода тестами
- **Участие в команде**: Активность в командных процессах

### Рекомендации для ментора

#### Поддержка развития стажера:
- **Регулярные встречи**: Еженедельные 1-on-1 встречи
- **Постановка целей**: Четкие и измеримые цели развития
- **Обратная связь**: Конструктивная и регулярная обратная связь
- **Ресурсы**: Предоставление материалов для изучения

#### Создание возможностей для роста:
- **Сложные задачи**: Постепенное увеличение сложности задач
- **Ответственность**: Передача ответственности за модули
- **Менторство**: Возможность помогать другим стажерам
- **Проекты**: Участие в интересных проектах

#### Оценка готовности к следующему уровню:
- **Объективные критерии**: Использование матрицы компетенций
- **Временные рамки**: Реалистичные ожидания по срокам
- **Индивидуальный подход**: Учет особенностей каждого стажера
- **План перехода**: Подготовка к переходу на Junior позицию

### Заключение

Матрица компетенций стажера Java разработчика — это инструмент для:
- **Оценки текущего уровня**: Понимания сильных и слабых сторон
- **Планирования развития**: Определения направлений роста
- **Мотивации**: Постановки четких целей и отслеживания прогресса
- **Принятия решений**: Объективной оценки готовности к следующему уровню

Помните, что развитие стажера — это инвестиция в будущее команды. Качественная подготовка стажера сегодня — это сильный разработчик завтра. 