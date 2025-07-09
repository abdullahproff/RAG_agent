import sqlite3
from datetime import datetime
import os

DATABASE_URL = "src/main_version/AI_agent.db"

class DatabaseOperations:
    def __init__(self, db_path=DATABASE_URL):
        # Преобразуем относительный путь в абсолютный
        self.db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', db_path))
        print(f"Подключение к базе данных: {self.db_path}")  # Отладочная информация
        # Проверяем существование файла базы данных
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"База данных не найдена по пути: {self.db_path}")

    def get_db(self):
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Это позволит получать результаты в виде словарей
            return conn
        except sqlite3.Error as e:
            print(f"Ошибка подключения к базе данных: {e}")
            raise

    def get_all_prompts(self):
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM Prompts ORDER BY created_at DESC')
                prompts = [dict(row) for row in cursor.fetchall()]
                print(f"Получено промптов: {len(prompts)}")  # Отладочная информация
                return prompts
        except sqlite3.Error as e:
            print(f"Ошибка при получении промптов: {e}")
            return []

    def add_prompt(self, question_id, question_text, prompt_template):
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO Prompts (question_id, question_text, prompt_template) VALUES (?, ?, ?)',
                (question_id, question_text, prompt_template)
            )
            conn.commit()
            return cursor.lastrowid

    def get_prompt(self, prompt_id):
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM Prompts WHERE question_id = ?', (prompt_id,))
            columns = [description[0] for description in cursor.description]
            row = cursor.fetchone()
            if row:
                return dict(zip(columns, row))
            return None

    def update_prompt(self, old_prompt_id, new_question_id, question_text, prompt_template):
        with self.get_db() as conn:
            cursor = conn.cursor()
            
            # Если ID изменился, нужно проверить, что новый ID не занят
            if old_prompt_id != new_question_id:
                cursor.execute('SELECT 1 FROM Prompts WHERE question_id = ?', (new_question_id,))
                if cursor.fetchone():
                    raise ValueError(f"Промпт с ID {new_question_id} уже существует")
                
                # Удаляем старую запись и создаем новую
                cursor.execute('DELETE FROM Prompts WHERE question_id = ?', (old_prompt_id,))
                cursor.execute(
                    'INSERT INTO Prompts (question_id, question_text, prompt_template) VALUES (?, ?, ?)',
                    (new_question_id, question_text, prompt_template)
                )
            else:
                # Просто обновляем существующую запись
                cursor.execute(
                    'UPDATE Prompts SET question_text = ?, prompt_template = ? WHERE question_id = ?',
                    (question_text, prompt_template, old_prompt_id)
                )
            
            conn.commit()
            if cursor.rowcount == 0 and old_prompt_id == new_question_id:
                raise ValueError(f"Промпт с ID {old_prompt_id} не найден")

    def delete_prompt(self, prompt_id):
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM Prompts WHERE question_id = ?', (prompt_id,))
            conn.commit()
            if cursor.rowcount == 0:
                raise ValueError(f"Промпт с ID {prompt_id} не найден")

    def get_all_users(self, page=1, per_page=10, sort_by='last_activity', sort_order='desc'):
        """Получение списка всех пользователей с их статистикой, пагинацией и сортировкой"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                # Валидация параметров сортировки
                valid_sort_columns = ['user_id', 'username', 'user_fullname', 'create_time', 'last_activity', 'message_count', 'reminders_count']
                if sort_by not in valid_sort_columns:
                    sort_by = 'last_activity'
                
                if sort_order.lower() not in ['asc', 'desc']:
                    sort_order = 'desc'
                
                # Основной запрос с сортировкой
                query = f"""
                SELECT 
                    u.user_id,
                    u.username,
                    u.user_fullname,
                    u.create_time,
                    COUNT(DISTINCT m.message) as message_count,
                    MAX(m.time) as last_activity,
                    COUNT(DISTINCT r.id_rem) as reminders_count
                FROM Users u
                LEFT JOIN Message_history m ON u.user_id = m.user_id
                LEFT JOIN Reminder r ON u.user_id = r.user_id
                GROUP BY u.user_id
                ORDER BY {sort_by} {sort_order.upper()}
                LIMIT ? OFFSET ?
                """
                
                offset = (page - 1) * per_page
                cursor.execute(query, (per_page, offset))
                columns = [description[0] for description in cursor.description]
                users = []
                
                for row in cursor.fetchall():
                    user_dict = dict(zip(columns, row))
                    # Получаем последние сообщения пользователя
                    cursor.execute("""
                        SELECT role, message, time
                        FROM Message_history
                        WHERE user_id = ?
                        ORDER BY time DESC
                        LIMIT 5
                    """, (user_dict['user_id'],))
                    user_dict['recent_messages'] = [
                        {
                            'role': msg[0],
                            'message': msg[1],
                            'time': msg[2]
                        }
                        for msg in cursor.fetchall()
                    ]
                    users.append(user_dict)
                
                # Получаем общее количество пользователей для пагинации
                cursor.execute("SELECT COUNT(*) FROM Users")
                total_users = cursor.fetchone()[0]
                
                return {
                    'users': users,
                    'total': total_users,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': (total_users + per_page - 1) // per_page,
                    'sort_by': sort_by,
                    'sort_order': sort_order
                }
                
        except sqlite3.Error as e:
            print(f"Ошибка при получении пользователей: {e}")
            return {
                'users': [],
                'total': 0,
                'page': 1,
                'per_page': per_page,
                'total_pages': 0,
                'sort_by': sort_by,
                'sort_order': sort_order
            }

    def get_user_details(self, user_id):
        """Получение детальной информации о пользователе"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                # Основная информация о пользователе
                cursor.execute("""
                    SELECT 
                        u.*,
                        COUNT(DISTINCT m.message) as message_count,
                        MAX(m.time) as last_activity,
                        COUNT(DISTINCT r.id_rem) as reminders_count
                    FROM Users u
                    LEFT JOIN Message_history m ON u.user_id = m.user_id
                    LEFT JOIN Reminder r ON u.user_id = r.user_id
                    WHERE u.user_id = ?
                    GROUP BY u.user_id
                """, (user_id,))
                row = cursor.fetchone()
                if not row:
                    return None
                
                columns = [description[0] for description in cursor.description]
                user_details = dict(zip(columns, row))

                # Получаем все сообщения пользователя
                cursor.execute("""
                    SELECT role, message, time
                    FROM Message_history
                    WHERE user_id = ?
                    ORDER BY time DESC
                """, (user_id,))
                user_details['messages'] = [
                    {
                        'role': msg[0],
                        'message': msg[1],
                        'time': msg[2]
                    }
                    for msg in cursor.fetchall()
                ]

                # Получаем все напоминания пользователя
                cursor.execute("""
                    SELECT id_rem, reminder_text, reminder_time
                    FROM Reminder
                    WHERE user_id = ?
                    ORDER BY reminder_time DESC
                """, (user_id,))
                user_details['reminders'] = [
                    {
                        'id': rem[0],
                        'text': rem[1],
                        'time': rem[2]
                    }
                    for rem in cursor.fetchall()
                ]

                return user_details
        except sqlite3.Error as e:
            print(f"Ошибка при получении деталей пользователя: {e}")
            return None

    def get_statistics(self, days=30):
        """Получение статистики за указанное количество дней"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                # Общие метрики
                cursor.execute("SELECT COUNT(*) FROM Users")
                total_users = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM Message_history")
                total_messages = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM Reminder")
                total_reminders = cursor.fetchone()[0]
                
                # Новые пользователи за период
                cursor.execute("""
                    SELECT COUNT(*) FROM Users 
                    WHERE create_time >= datetime('now', '-{} days')
                """.format(days))
                new_users = cursor.fetchone()[0]
                
                # Активные пользователи за период (отправившие сообщения)
                cursor.execute("""
                    SELECT COUNT(DISTINCT user_id) FROM Message_history 
                    WHERE time >= datetime('now', '-{} days')
                """.format(days))
                active_users = cursor.fetchone()[0]
                
                # Регистрации по дням за период
                cursor.execute("""
                    SELECT DATE(create_time) as date, COUNT(*) as count
                    FROM Users 
                    WHERE create_time >= datetime('now', '-{} days')
                    GROUP BY DATE(create_time)
                    ORDER BY date
                """.format(days))
                registrations_by_day = [{'date': row[0], 'count': row[1]} for row in cursor.fetchall()]
                
                # Сообщения по дням за период
                cursor.execute("""
                    SELECT DATE(time) as date, COUNT(*) as count
                    FROM Message_history 
                    WHERE time >= datetime('now', '-{} days') AND role = 'user'
                    GROUP BY DATE(time)
                    ORDER BY date
                """.format(days))
                messages_by_day = [{'date': row[0], 'count': row[1]} for row in cursor.fetchall()]
                
                # Топ активных пользователей за период
                cursor.execute("""
                    SELECT u.user_id, u.username, u.user_fullname, COUNT(m.message) as message_count
                    FROM Users u
                    LEFT JOIN Message_history m ON u.user_id = m.user_id 
                    WHERE m.time >= datetime('now', '-{} days') AND m.role = 'user'
                    GROUP BY u.user_id
                    ORDER BY message_count DESC
                    LIMIT 10
                """.format(days))
                top_users = [
                    {
                        'user_id': row[0],
                        'username': row[1] or 'Не указано',
                        'user_fullname': row[2] or 'Не указано',
                        'message_count': row[3]
                    }
                    for row in cursor.fetchall()
                ]
                
                # Статистика по специализациям
                cursor.execute("""
                    SELECT Specialization, COUNT(*) as count
                    FROM Users 
                    WHERE Specialization IS NOT NULL
                    GROUP BY Specialization
                    ORDER BY count DESC
                """)
                specializations = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]
                
                # Статистика по ролям
                cursor.execute("""
                    SELECT Role, COUNT(*) as count
                    FROM Users 
                    WHERE Role IS NOT NULL
                    GROUP BY Role
                    ORDER BY count DESC
                """)
                roles = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]
                
                return {
                    'total_users': total_users,
                    'total_messages': total_messages,
                    'total_reminders': total_reminders,
                    'new_users': new_users,
                    'active_users': active_users,
                    'registrations_by_day': registrations_by_day,
                    'messages_by_day': messages_by_day,
                    'top_users': top_users,
                    'specializations': specializations,
                    'roles': roles,
                    'period_days': days
                }
                
        except sqlite3.Error as e:
            print(f"Ошибка при получении статистики: {e}")
            return {
                'total_users': 0,
                'total_messages': 0,
                'total_reminders': 0,
                'new_users': 0,
                'active_users': 0,
                'registrations_by_day': [],
                'messages_by_day': [],
                'top_users': [],
                'specializations': [],
                'roles': [],
                'period_days': days
            }
    
    def get_all_questions(self, page=1, per_page=20, category=None):
        """Получение списка всех вопросов с пагинацией и фильтрацией"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                # Базовый запрос
                base_query = """
                SELECT q.*, p.prompt_template, v.display_name as vector_store_display
                FROM Questions q
                LEFT JOIN Prompts p ON q.prompt_id = p.question_id
                LEFT JOIN VectorStores v ON q.vector_store = v.name
                """
                
                # Добавляем фильтр по тегу если нужно
                where_clause = ""
                params = []
                if category:
                    where_clause = "WHERE q.category = ?"
                    params.append(category)
                
                # Считаем общее количество
                count_query = f"SELECT COUNT(*) FROM Questions q {where_clause}"
                cursor.execute(count_query, params)
                total_count = cursor.fetchone()[0]
                
                # Получаем вопросы с пагинацией
                query = f"{base_query} {where_clause} ORDER BY q.order_position, q.id LIMIT ? OFFSET ?"
                params.extend([per_page, (page - 1) * per_page])
                cursor.execute(query, params)
                
                questions = [dict(row) for row in cursor.fetchall()]
                
                return {
                    'questions': questions,
                    'total': total_count,
                    'page': page,
                    'per_page': per_page,
                    'total_pages': (total_count + per_page - 1) // per_page
                }
                
        except sqlite3.Error as e:
            print(f"Ошибка при получении вопросов: {e}")
            return {
                'questions': [],
                'total': 0,
                'page': 1,
                'per_page': per_page,
                'total_pages': 0
            }
    
    def get_question(self, callback_data):
        """Получение одного вопроса по callback_data"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT q.*, p.prompt_template
                FROM Questions q
                LEFT JOIN Prompts p ON q.prompt_id = p.question_id
                WHERE q.callback_data = ?
            """, (callback_data,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    def add_question(self, callback_data, question_text, question_id, category=None, 
                    role=None, specialization=None, vector_store='auto', prompt_id=None, 
                    is_active=True, order_position=None):
        """Добавление нового вопроса"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                # Если order_position не указан, ставим в конец
                if order_position is None:
                    cursor.execute("SELECT MAX(order_position) FROM Questions")
                    max_pos = cursor.fetchone()[0] or 0
                    order_position = max_pos + 10
                
                cursor.execute("""
                    INSERT INTO Questions 
                    (callback_data, question_text, question_id, category, role, 
                     specialization, vector_store, prompt_id, is_active, order_position)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    callback_data, question_text, question_id, category, role,
                    specialization, vector_store, prompt_id, is_active, order_position
                ))
                conn.commit()
                return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Ошибка при добавлении вопроса: {e}")
            raise
    
    def update_question(self, old_callback_data, **kwargs):
        """Обновление существующего вопроса"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                
                # Строим запрос на обновление
                set_parts = []
                values = []
                
                for key, value in kwargs.items():
                    if key in ['callback_data', 'question_text', 'question_id', 'category', 
                              'role', 'specialization', 'vector_store', 'prompt_id', 
                              'is_active', 'order_position']:
                        set_parts.append(f"{key} = ?")
                        values.append(value)
                
                if not set_parts:
                    return False
                
                values.append(old_callback_data)
                
                cursor.execute(f"""
                    UPDATE Questions 
                    SET {', '.join(set_parts)}, updated_at = CURRENT_TIMESTAMP
                    WHERE callback_data = ?
                """, values)
                
                conn.commit()
                return cursor.rowcount > 0
                
        except sqlite3.Error as e:
            print(f"Ошибка при обновлении вопроса: {e}")
            raise
    
    def delete_question(self, callback_data):
        """Удаление вопроса"""
        with self.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM Questions WHERE callback_data = ?", (callback_data,))
            conn.commit()
            if cursor.rowcount == 0:
                raise ValueError(f"Вопрос с callback_data {callback_data} не найден")
    
    def get_all_vector_stores(self):
        """Получение списка всех векторных хранилищ"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM VectorStores ORDER BY id")
                return [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"Ошибка при получении векторных хранилищ: {e}")
            return []
    
    def get_question_categories(self):
        """Получение списка всех тегов вопросов"""
        try:
            with self.get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT DISTINCT category, COUNT(*) as count 
                    FROM Questions 
                    WHERE category IS NOT NULL 
                    GROUP BY category 
                    ORDER BY category
                """)
                return [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"Ошибка при получении тегов: {e}")
            return []
    
    def reload_questions_cache(self):
        """Отправляет команду боту на перезагрузку кеша вопросов"""
        try:
            import requests
            response = requests.post('http://127.0.0.1:8007/reload-questions')
            return response.json()
        except Exception as e:
            print(f"Ошибка при перезагрузке кеша вопросов: {e}")
            return {"success": False, "error": str(e)} 
