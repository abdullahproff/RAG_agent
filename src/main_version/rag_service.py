import os
from dotenv import load_dotenv
import string
import asyncio
import sqlite3
import json
import re
from fastapi import FastAPI, WebSocket
import websockets
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.chat_models import GigaChat
from langchain_gigachat import GigaChat
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain.retrievers import EnsembleRetriever
import uvicorn

DATABASE_URL = "/app/src/main_version/AI_agent.db"

load_dotenv()


# Инициализация FastAPI
app = FastAPI()

api_key = os.getenv("GIGACHAT_API_KEY")

folder_path_bsa = os.path.join(os.path.dirname(__file__), "docs/docs_pack_bsa")
folder_path_test = os.path.join(os.path.dirname(__file__), "docs/docs_pack_test")
folder_path_web = os.path.join(os.path.dirname(__file__), "docs/docs_pack_web")
folder_path_java = os.path.join(os.path.dirname(__file__), "docs/docs_pack_java")
folder_path_python = os.path.join(os.path.dirname(__file__), "docs/docs_pack_python")

def create_docs_from_txt(folder_path):
    # Получаем список всех файлов .txt в указанной директории
    file_paths = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith(".txt")]

    # Список для хранения загруженных документов
    docs = []

    # Загружаем текст из файлов
    for file_path in file_paths:
        loader = TextLoader(file_path)
        docs.extend(loader.load())

    # Разделяем текст на чанки
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,  # Увеличено с 500 до 800 для лучшего контекста
        chunk_overlap=200  # Увеличено с 100 до 200 для лучшего перекрытия
    )
    split_docs = text_splitter.split_documents(docs)
    return split_docs

# Документы по аналитику
split_docs_bsa = create_docs_from_txt(folder_path_bsa)
# Документы по Тестировщику
split_docs_test = create_docs_from_txt(folder_path_test)
# Документы по Фронтендеру
split_docs_web = create_docs_from_txt(folder_path_web)
# Документы по Java разработчику
split_docs_java = create_docs_from_txt(folder_path_java)

split_docs_python = create_docs_from_txt(folder_path_python)

# Инициализация модели для эмбеддингов E5
model_name = "intfloat/multilingual-e5-base"
model_kwargs = {'device': 'cpu'}
encode_kwargs = {'normalize_embeddings': True}  # E5 требует нормализации

def add_e5_prefix_to_query(text):
    """Добавляет префикс 'query: ' к тексту для модели E5"""
    if not text.startswith("query: "):
        return f"query: {text}"
    return text

def add_e5_prefix_to_documents(documents):
    """Добавляет префикс 'passage: ' к документам для модели E5"""
    processed_docs = []
    for doc in documents:
        if hasattr(doc, 'page_content'):
            # Для объектов Document
            if not doc.page_content.startswith("passage: "):
                doc.page_content = f"passage: {doc.page_content}"
            processed_docs.append(doc)
        else:
            # Для обычных строк
            if not doc.startswith("passage: "):
                processed_docs.append(f"passage: {doc}")
            else:
                processed_docs.append(doc)
    return processed_docs

# Создаем кастомный класс эмбедингов для E5
class E5HuggingFaceEmbeddings(HuggingFaceEmbeddings):
    def embed_query(self, text: str) -> list[float]:
        """Эмбединг для запроса с префиксом 'query:'"""
        prefixed_text = add_e5_prefix_to_query(text)
        return super().embed_query(prefixed_text)
    
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Эмбединг для документов с префиксом 'passage:'"""
        prefixed_texts = [f"passage: {text}" if not text.startswith("passage: ") else text for text in texts]
        return super().embed_documents(prefixed_texts)

embedding = E5HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

# Создание векторного хранилища для Аналитика
vector_store_bsa = FAISS.from_documents(split_docs_bsa, embedding=embedding)
embedding_retriever_bsa = vector_store_bsa.as_retriever(search_kwargs={"k": 15})

# Создание векторного хранилища для Тестировщика
vector_store_test = FAISS.from_documents(split_docs_test, embedding=embedding)
embedding_retriever_test = vector_store_test.as_retriever(search_kwargs={"k": 15})

# Создание векторного хранилища для Фронтенд разработчика
vector_store_web = FAISS.from_documents(split_docs_web, embedding=embedding)
embedding_retriever_web = vector_store_web.as_retriever(search_kwargs={"k": 15})

# Создание векторного хранилища для Java разработчика
vector_store_java = FAISS.from_documents(split_docs_java, embedding=embedding)
embedding_retriever_java = vector_store_java.as_retriever(search_kwargs={"k": 15})

# Создание векторного хранилища для Python разработчика
vector_store_python = FAISS.from_documents(split_docs_python, embedding=embedding)
embedding_retriever_python = vector_store_python.as_retriever(search_kwargs={"k": 15})

# Создание ансамбля ретриверов для поиска по всем базам
ensemble_retriever = EnsembleRetriever(
    retrievers=[
        embedding_retriever_bsa,
        embedding_retriever_test,
        embedding_retriever_web,
        embedding_retriever_java,
        embedding_retriever_python
    ],
    weights=[0.2, 0.2, 0.2, 0.2, 0.2]  # Равные веса для всех баз
)

# Инициализация модели GigaChat
def create_retrieval_chain_from_folder(role, specialization, question_id, embedding_retriever, prompt_template):
    
    # Заполнение шаблона промпта
    template = string.Template(prompt_template)
    filled_prompt = template.substitute(role=role, specialization=specialization)

    # Создание промпта
    prompt = ChatPromptTemplate.from_template(filled_prompt)

    llm = GigaChat(
        credentials=api_key,
        model='GigaChat-2-Max',
        verify_ssl_certs=False,
        profanity_check=False
    )

    # Создание цепочки для работы с документами
    document_chain = create_stuff_documents_chain(
        llm=llm,
        prompt=prompt
    )

    # Создание retrieval_chain
    retrieval_chain = create_retrieval_chain(embedding_retriever, document_chain)

    return retrieval_chain

def get_prompt_from_db(question_id):
    """Получает промт из базы данных по ID вопроса"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT prompt_template FROM Prompts WHERE question_id = ?", (question_id,))
        result = cursor.fetchone()
        if result:
            return result[0]
        else:
            return None
    finally:
        conn.close()



def get_best_retriever_for_role_spec(role, specialization, vector_store_preference='auto'):
    """
    Выбирает лучший retriever на основе специализации и настроек вопроса
    
    Args:
        role: Роль пользователя
        specialization: Специализация пользователя
        vector_store_preference: Настройка векторного хранилища из БД ('auto', 'by_specialization', 'analyst', 'qa', 'web', 'java', 'python', 'ensemble')
    """
    # Маппинг названий векторных хранилищ на ретриверы
    store_mapping = {
        'analyst': embedding_retriever_bsa,
        'qa': embedding_retriever_test,
        'web': embedding_retriever_web,
        'java': embedding_retriever_java,
        'python': embedding_retriever_python,
        'ensemble': ensemble_retriever
    }
    
    # Если указано конкретное хранилище, используем его
    if vector_store_preference in store_mapping:
        print(f"Используется явно указанный retriever: {vector_store_preference}")
        return store_mapping[vector_store_preference]
    
    # Если auto или by_specialization, выбираем по специализации
    spec_lower = specialization.lower() if specialization else ""
    
    if 'аналитик' in spec_lower:
        print("Выбран retriever для АНАЛИТИКА")
        return embedding_retriever_bsa
    elif 'тестировщик' in spec_lower:
        print("Выбран retriever для ТЕСТИРОВЩИКА")
        return embedding_retriever_test
    elif 'web' in spec_lower or 'фронтенд' in spec_lower:
        print("Выбран retriever для WEB")
        return embedding_retriever_web
    elif 'java' in spec_lower:
        print("Выбран retriever для JAVA")
        return embedding_retriever_java
    elif 'python' in spec_lower:
        print("Выбран retriever для PYTHON")
        return embedding_retriever_python
    else:
        print(f"Не удалось определить ретривер для специализации '{specialization}'. Используется ансамбль из 5 баз.")
        return ensemble_retriever

async def generate_semantic_search_queries(question, role, specialization):
    """
    Генерирует семантически связанные поисковые запросы для улучшения векторного поиска
    """
    # Создаем LLM для генерации альтернативных запросов
    llm = GigaChat(
        credentials=api_key,
        model='GigaChat-2-Max',
        verify_ssl_certs=False,
        profanity_check=False
    )
    
    # Промпт для генерации альтернативных поисковых запросов
    query_generation_prompt = f"""
Дан вопрос: "{question}"
Роль пользователя: {role if role else "не указана"}
Специализация: {specialization if specialization else "не указана"}

Сгенерируй -5 альтернативных поисковых запросов для поиска в корпоративной базе знаний.

Альтернативные запросы должны:
1. Включать точные фразы из корпоративных документов
2. Фокусироваться на конкретных практиках и процессах
3. Быть короткими и точными для векторного поиска
4. Покрывать разные аспекты развития и лидерства
5. Учитывать роль и специализацию пользователя

Ответь только списком из 5-6 запросов, каждый с новой строки, без нумерации и дополнительного текста:
"""
    
    try:
        response = await llm.ainvoke(query_generation_prompt)
        alternative_queries = [q.strip() for q in response.content.split('\n') if q.strip()]
        
        # Добавляем исходный вопрос в начало списка
        all_queries = [question] + alternative_queries
        
        print(f"Сгенерированы поисковые запросы:")
        for i, query in enumerate(all_queries, 1):
            print(f"  {i}. {query}")
        
        return all_queries
        
    except Exception as e:
        print(f"Ошибка при генерации альтернативных запросов: {e}")
        return [question]  # Возвращаем только исходный вопрос в случае ошибки

async def enhanced_vector_search(question, role, specialization, embedding_retriever, top_k=8):
    """
    Улучшенный векторный поиск с использованием множественных семантических запросов
    """
    # Генерируем альтернативные поисковые запросы
    search_queries = await generate_semantic_search_queries(question, role, specialization)
    
    # Собираем все найденные документы
    all_docs = []
    doc_scores = {}  # Для подсчета "голосов" за каждый документ
    
    for query in search_queries:
        try:
            # Выполняем поиск для каждого запроса
            docs = await embedding_retriever.ainvoke(query)
            
            # Добавляем документы с весами (первые запросы важнее)
            weight = 1.0 / (search_queries.index(query) + 1)  # Убывающий вес
            
            for i, doc in enumerate(docs):
                doc_id = doc.metadata.get('source', '') + str(hash(doc.page_content[:100]))
                
                # Увеличиваем счетчик для документа
                if doc_id not in doc_scores:
                    doc_scores[doc_id] = {
                        'doc': doc,
                        'score': 0,
                        'query_matches': []
                    }
                
                # Добавляем взвешенный балл (документы в топе получают больше баллов)
                position_weight = 1.0 / (i + 1)
                doc_scores[doc_id]['score'] += weight * position_weight
                doc_scores[doc_id]['query_matches'].append(query)
        
        except Exception as e:
            print(f"Ошибка поиска для запроса '{query}': {e}")
            continue
    
    # Сортируем документы по общему счету
    sorted_docs = sorted(doc_scores.values(), key=lambda x: x['score'], reverse=True)
    
    # Возвращаем топ-K документов
    result_docs = [item['doc'] for item in sorted_docs[:top_k]]
    
    print(f"\nРезультаты улучшенного векторного поиска:")
    for i, item in enumerate(sorted_docs[:top_k], 1):
        doc = item['doc']
        score = item['score']
        source = doc.metadata.get('source', 'Неизвестно')
        print(f"  {i}. Счет: {score:.3f} | Источник: {source.split('/')[-1]}")
        print(f"     Совпадения с запросами: {len(item['query_matches'])}")
        print(f"     Запросы: {item['query_matches'][:2]}")  # Показываем первые 2 запроса
        print(f"     Содержимое: {doc.page_content[:150]}...")
        print()
    
    return result_docs

async def create_enhanced_retrieval_chain(role, specialization, question_id, embedding_retriever, prompt_template):
    """
    Создает улучшенную retrieval chain с семантическим векторным поиском и поддержкой стриминга
    """
    # ИСПРАВЛЕНО: Сначала заполняем только $role и $specialization
    # {input} и {context} будут заполнены позже с реальными данными
    template = string.Template(prompt_template)
    base_prompt = template.substitute(
        role=role,
        specialization=specialization
    )
    
    # Создание LLM
    llm = GigaChat(
        credentials=api_key,
        model='GigaChat-2-Max',
        verify_ssl_certs=False,
        profanity_check=False
    )
    
    # Создаем объект, который поддерживает метод astream
    class EnhancedRetrievalChain:
        def __init__(self, llm, base_prompt, role, specialization, embedding_retriever):
            self.llm = llm
            self.base_prompt = base_prompt
            self.role = role
            self.specialization = specialization
            self.embedding_retriever = embedding_retriever

        async def astream(self, input_data):
            """
            Асинхронный стриминг с улучшенным поиском и генерацией ответа.
            """
            question = input_data.get('input', '')
            dialogue_context = input_data.get('dialogue_context', '[]')

            # 1. Используем улучшенный поиск для получения релевантных документов
            docs = await enhanced_vector_search(question, self.role, self.specialization, self.embedding_retriever)
            
            # 2. Формируем контекст из документов
            context_text = "\n\n".join([doc.page_content for doc in docs])
            
            # 3. ИСПРАВЛЕНО: Правильно заполняем {input} и {context} в промпте
            # Проверяем, есть ли {input} и {context} в промпте
            if '{input}' in self.base_prompt and '{context}' in self.base_prompt:
                # Заполняем переменные {input} и {context}
                final_prompt = self.base_prompt.replace('{input}', question).replace('{context}', context_text)
                
                # Добавляем контекст диалога если есть
                if dialogue_context and dialogue_context != '[]':
                    dialogue_history_prompt_part = f"\\n\\nКонтекст предыдущих сообщений:\\n{dialogue_context}"
                    final_prompt = final_prompt + dialogue_history_prompt_part
                    
            elif '{context}' in self.base_prompt:
                # Только {context} (старые промпты)
                filled_prompt = self.base_prompt.replace('{context}', context_text)
                
                # Добавляем контекст диалога и вопрос
                dialogue_history_prompt_part = ""
                if dialogue_context and dialogue_context != '[]':
                    dialogue_history_prompt_part = f"\\n\\nКонтекст предыдущих сообщений:\\n{dialogue_context}"
                
                final_prompt = f"{filled_prompt}{dialogue_history_prompt_part}\\n\\nВопрос: {question}\\n\\nОтвет:"
                
            else:
                # Fallback: старая логика для промптов без переменных
                dialogue_history_prompt_part = ""
                if dialogue_context and dialogue_context != '[]':
                    dialogue_history_prompt_part = f"\\n\\nКонтекст предыдущих сообщений:\\n{dialogue_context}"

                final_prompt = f"{self.base_prompt}{dialogue_history_prompt_part}\\n\\nКонтекст из документов:\\n{context_text}\\n\\nВопрос: {question}\\n\\nОтвет:"
            
            # Отладочная информация
            # print(f"\\n--- FINAL PROMPT ---\\n{final_prompt}\\n--- END FINAL PROMPT ---\\n")
            
            # 4. Стримим ответ от LLM
            try:
                async for chunk in self.llm.astream(final_prompt):
                    if chunk and chunk.content:
                        yield {"answer": chunk.content}
            except Exception as e:
                print(f"ОШИБКА в стриминге LLM: {e}")
                yield {"answer": f"Произошла ошибка при генерации ответа: {e}"}

    return EnhancedRetrievalChain(llm, base_prompt, role, specialization, embedding_retriever)

async def create_enhanced_retrieval_chain_for_suggestions(role, specialization, user_question, bot_answer, embedding_retriever, prompt_template):
    """
    Создает улучшенную retrieval chain для генерации связанных вопросов (промпт 999)
    """
    # Заполнение шаблона промпта со всеми необходимыми переменными
    template = string.Template(prompt_template)
    filled_prompt = template.substitute(
        role=role,
        specialization=specialization,
        user_question=user_question,
        bot_answer=bot_answer
    )
    
    # Создание LLM
    llm = GigaChat(
        credentials=api_key,
        model='GigaChat-2-Max',
        verify_ssl_certs=False,
        profanity_check=False
    )
    
    # Создаем кастомную функцию для обработки запроса
    async def enhanced_suggestions_process(input_data):
        search_query = input_data.get('input', '')
        
        print(f"Генерируем связанные вопросы с улучшенным векторным поиском: {search_query}")
        
        # Выполняем улучшенный векторный поиск
        relevant_docs = await enhanced_vector_search(search_query, role, specialization, embedding_retriever)
        
        # Формируем контекст из найденных документов
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        # Создаем финальный промпт с контекстом
        final_prompt = f"""{filled_prompt}

Дополнительный контекст из корпоративных документов:
{context}

Используй этот контекст для генерации более релевантных и специфичных вопросов, связанных с ролью {role} и специализацией {specialization}."""
        
        print(f"Отправляем запрос в GigaChat для генерации связанных вопросов...")
        
        # Получаем ответ от LLM
        response = await llm.ainvoke(final_prompt)
        
        return {"answer": response.content}
    
    return enhanced_suggestions_process

#mplusk1
@app.websocket("/ws_suggest")
async def websocket_suggest_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("ws_suggest: connection accepted")
    data = await websocket.receive_text()
    print(f"ws_suggest: received data: {data}")
    payload = json.loads(data)
    
    user_question = payload.get("user_question")
    bot_answer = payload.get("bot_answer")
    role = payload.get("role")
    specialization = payload.get("specialization")

    prompt_template = get_prompt_from_db(999)
    if not prompt_template:
        print("ws_suggest: ERROR - Prompt 999 not found")
        await websocket.send_text(json.dumps({"error": "Prompt not found"}))
        await websocket.close()
        return

    # Всегда используем RAG для генерации связанных вопросов (промпт 999)
    use_rag = True
    print(f"ws_suggest: Using RAG for question generation")
    
    if use_rag:
        # Используем RAG для более точной генерации вопросов
        embedding_retriever = get_best_retriever_for_role_spec(role, specialization)
        
        # Создаем специальную retrieval chain для генерации связанных вопросов (промпт 999)
        retrieval_chain = await create_enhanced_retrieval_chain_for_suggestions(
            role=role,
            specialization=specialization,
            user_question=user_question,
            bot_answer=bot_answer,
            embedding_retriever=embedding_retriever,
            prompt_template=prompt_template
        )
        
        try:
            print("ws_suggest: Using RAG-enhanced question generation...")
            # Формируем запрос для поиска релевантных документов
            search_query = f"Вопросы по теме: {user_question}. Роль: {role}. Специализация: {specialization}"
            
            # Вызываем функцию напрямую, так как она возвращает функцию
            response = await retrieval_chain({'input': search_query})
            raw_response = response.get('answer', '')
            print(f"ws_suggest: RAG response: {raw_response}")
            
            # Парсим ответ
            cleaned_response = re.sub(r'^\s*\d+\.\s*', '', raw_response, flags=re.MULTILINE)
            questions = [q.strip() for q in cleaned_response.split('\n') if q.strip() and len(q.strip()) > 10]
            
            # Ограничиваем до 5 вопросов
            questions = questions[:5]
            
        except Exception as e:
            print(f"ws_suggest: ERROR in RAG call: {e}, falling back to direct LLM")
            use_rag = False
    
    if not use_rag:
        # Используем прямое обращение к LLM без RAG
        template = string.Template(prompt_template)
        filled_prompt = template.substitute(
            user_question=user_question,
            bot_answer=bot_answer,
            role=role,
            specialization=specialization
        )

        # Добавляем инструкции по генерации релевантных вопросов
        question_generation_guidance = f"""
Учитывая, что пользователь имеет роль '{role}' и специализацию '{specialization}',
сгенерируйте 3-5 релевантных вопросов, которые:
1. Соответствуют текущему контексту диалога
2. Учитывают специфику роли и специализации пользователя
3. Помогают углубить понимание обсуждаемой темы
4. Могут быть полезны для профессионального развития в рамках специализации
5. Не выходят за рамки компетенций пользователя

Формат ответа: каждый вопрос с новой строки, без нумерации.
"""
        filled_prompt += question_generation_guidance

        llm = GigaChat(
            credentials=api_key,
            model='GigaChat-2-Max',
            verify_ssl_certs=False,
            profanity_check=False
        )
        
        try:
            print(f"ws_suggest: Using direct LLM for question generation...")
            response = await llm.ainvoke(filled_prompt)
            print(f"ws_suggest: LLM response: {response.content}")
            
            # Удаляем нумерацию, чтобы обеспечить корректный парсинг
            cleaned_response = re.sub(r'^\s*\d+\.\s*', '', response.content, flags=re.MULTILINE)
            questions = [q.strip() for q in cleaned_response.split('\n') if q.strip()]
        except Exception as e:
            print(f"ws_suggest: ERROR in LLM call: {e}")
            await websocket.send_text(json.dumps({"error": str(e)}))
            await websocket.close()
            return

    print(f"ws_suggest: Final questions: {questions}")
    await websocket.send_text(json.dumps(questions))
    print(f"ws_suggest: Sent questions to client: {json.dumps(questions)}")
    await websocket.close()
    print("ws_suggest: connection closed")
#mplusk2
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Обрабатывает WebSocket соединение и передает стриминг ответа GigaChat."""
    await websocket.accept()
    question = await websocket.receive_text()
    role = await websocket.receive_text()
    specialization = await websocket.receive_text()
    question_id = await websocket.receive_text()
    context = await websocket.receive_text()
    print(context)
    count = await websocket.receive_text()
    
    # Получаем параметр vector_store (если есть)
    try:
        vector_store = await websocket.receive_text()
    except:
        vector_store = 'auto'  # Значение по умолчанию для обратной совместимости
    
    question_id = int(question_id)
    count = int(count)
    print(question)
    print(role)
    print(specialization)
    print(f"количество {count}")
    print(f"айди {question_id}")
    print(f"векторное хранилище {vector_store}")
    
    prompt_template = get_prompt_from_db(question_id)
    if not prompt_template:
        prompt_template = get_prompt_from_db(777)
    
    # Логика выбора retriever теперь учитывает параметр vector_store
    print(f"Определяем retriever для роли '{role}', специализации '{specialization}' и настройки '{vector_store}'...")
    embedding_retriever = get_best_retriever_for_role_spec(role, specialization, vector_store)

    # Создаем retrieval_chain для вопросов, которые его используют
    retrieval_chain = None
    should_use_rag = True # Всегда используем RAG с новой логикой
    
    # --- 1. Всегда используем улучшенный RAG ---
    if should_use_rag:
        print(f"RAG-search для question_id={question_id}")
        retrieval_chain = await create_enhanced_retrieval_chain(
            role=role,
            specialization=specialization,
            question_id=question_id,
            embedding_retriever=embedding_retriever,
            prompt_template=prompt_template,
        )

        # Для свободного ввода передаём историю диалога, иначе пустой список
        dialogue_ctx = context if question_id == 888 and context and context != "[]" else "[]"

        async for chunk in retrieval_chain.astream({
            "input": question,
            "dialogue_context": dialogue_ctx,
        }):
            if chunk and chunk.get("answer"):
                await websocket.send_text(chunk["answer"])
    else:
        # --- 2. Fallback ------------
        print("[WARN] should_use_rag==False – fallback stub")
        await websocket.send_text("К сожалению, сейчас сервис недоступен.")

    await websocket.close()

if __name__ == "__main__":
    print("Запускаем сервер на ws://127.0.0.1:8000/ws")
    uvicorn.run(app, host="0.0.0.0", port=8000)


