import sqlite3
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

DATABASE_URL = "/app/src/main_version/AI_agent.db"

class QuestionsLoader:
    """Класс для загрузки вопросов из базы данных"""
    
    def __init__(self, db_path=DATABASE_URL):
        self.db_path = db_path
        self._questions_cache = {}
        self._categories_cache = {}
        self._vector_stores_cache = {}
        self.load_all_questions()
    
    def get_db_connection(self):
        """Создает подключение к БД"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def load_all_questions(self):
        """Загружает все активные вопросы из БД в кеш"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Загружаем вопросы
            cursor.execute("""
                SELECT q.*, p.prompt_template
                FROM Questions q
                LEFT JOIN Prompts p ON q.prompt_id = p.question_id
                WHERE q.is_active = 1
                ORDER BY q.order_position, q.id
            """)
            
            questions = cursor.fetchall()
            
            # Очищаем кеши
            self._questions_cache.clear()
            self._categories_cache.clear()
            
            # Заполняем кеши
            for q in questions:
                question_dict = dict(q)
                callback_data = question_dict['callback_data']
                category = question_dict['category']
                
                # Кеш по callback_data
                self._questions_cache[callback_data] = question_dict
                
                # Кеш по категориям
                if category not in self._categories_cache:
                    self._categories_cache[category] = []
                self._categories_cache[category].append(question_dict)
            
            # Загружаем векторные хранилища
            cursor.execute("SELECT * FROM VectorStores")
            vector_stores = cursor.fetchall()
            
            self._vector_stores_cache = {
                vs['name']: dict(vs) for vs in vector_stores
            }
            
            conn.close()
            
            logger.info(f"Загружено {len(self._questions_cache)} вопросов из БД")
            
        except Exception as e:
            logger.error(f"Ошибка при загрузке вопросов: {e}")
    
    def get_question_by_callback(self, callback_data: str) -> Optional[Dict]:
        """Получает вопрос по callback_data"""
        return self._questions_cache.get(callback_data)
    
    def get_questions_by_category(self, category: str) -> List[Dict]:
        """Получает список вопросов по категории"""
        return self._categories_cache.get(category, [])
    
    def get_questions_by_role(self, role: str, specialization: Optional[str] = None) -> List[Dict]:
        """Получает вопросы, доступные для определенной роли"""
        result = []
        
        for q in self._questions_cache.values():
            # Проверяем, подходит ли вопрос для роли
            if q['role'] is None or q['role'] == role:
                # Проверяем специализацию, если она указана
                if q['specialization'] is None or q['specialization'] == specialization:
                    result.append(q)
        
        return sorted(result, key=lambda x: (x['order_position'] if x['order_position'] is not None else float('inf'), x['id']))
    
    def get_categories_for_role(self, role: str) -> List[str]:
        """Получает список категорий, доступных для роли"""
        categories = set()
        
        for q in self._questions_cache.values():
            if q['role'] is None or q['role'] == role:
                if q['category']:
                    categories.add(q['category'])
        
        return sorted(list(categories))
    
    def get_vector_store_for_question(self, callback_data: str, user_specialization: str) -> str:
        """Определяет векторное хранилище для вопроса"""
        question = self.get_question_by_callback(callback_data)
        if not question:
            return "auto"
        
        vector_store = question.get('vector_store', 'auto')
        
        # Обрабатываем специальные значения
        if vector_store == 'by_specialization':
            # Маппинг специализаций на векторные хранилища
            spec_to_store = {
                'Аналитик': 'analyst',
                'Тестировщик': 'qa',
                'WEB': 'web',
                'Java': 'java',
                'Python': 'python'
            }
            return spec_to_store.get(user_specialization, 'ensemble')
        
        return vector_store
    
    def get_all_vector_stores(self) -> List[Dict]:
        """Возвращает список всех доступных векторных хранилищ"""
        return list(self._vector_stores_cache.values())
    
    def reload_questions(self):
        """Перезагружает вопросы из БД"""
        logger.info("Перезагрузка вопросов из БД...")
        self.load_all_questions()
    
    def add_question(self, callback_data: str, question_text: str, question_id: int,
                    category: str = None, role: str = None, specialization: str = None,
                    vector_store: str = 'auto', prompt_id: int = None) -> bool:
        """Добавляет новый вопрос в БД"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Получаем максимальную позицию
            cursor.execute("SELECT MAX(order_position) FROM Questions")
            max_pos = cursor.fetchone()[0] or 0
            
            cursor.execute("""
                INSERT INTO Questions 
                (callback_data, question_text, question_id, category, role, 
                 specialization, vector_store, prompt_id, order_position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                callback_data, question_text, question_id, category, role,
                specialization, vector_store, prompt_id, max_pos + 10
            ))
            
            conn.commit()
            conn.close()
            
            # Перезагружаем кеш
            self.reload_questions()
            
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при добавлении вопроса: {e}")
            return False
    
    def update_question(self, callback_data: str, **kwargs) -> bool:
        """Обновляет существующий вопрос"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Строим запрос на обновление
            set_parts = []
            values = []
            
            for key, value in kwargs.items():
                if key in ['question_text', 'question_id', 'category', 'role', 
                          'specialization', 'vector_store', 'prompt_id', 
                          'is_active', 'order_position']:
                    set_parts.append(f"{key} = ?")
                    values.append(value)
            
            if not set_parts:
                return False
            
            values.append(callback_data)
            
            cursor.execute(f"""
                UPDATE Questions 
                SET {', '.join(set_parts)}, updated_at = CURRENT_TIMESTAMP
                WHERE callback_data = ?
            """, values)
            
            conn.commit()
            success = cursor.rowcount > 0
            conn.close()
            
            if success:
                self.reload_questions()
            
            return success
            
        except Exception as e:
            logger.error(f"Ошибка при обновлении вопроса: {e}")
            return False

# Глобальный экземпляр загрузчика
questions_loader = QuestionsLoader() 