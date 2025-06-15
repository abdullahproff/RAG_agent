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

folder_path_1 = os.path.join(os.path.dirname(__file__), "txt_docs/docs_pack_1")
folder_path_2 = os.path.join(os.path.dirname(__file__), "txt_docs/docs_pack_2")
folder_path_3 = os.path.join(os.path.dirname(__file__), "txt_docs/docs_pack_3")

folder_path_full = os.path.join(os.path.dirname(__file__), "txt_docs/docs_pack_full")

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
        chunk_size=500,  # Размер чанка
        chunk_overlap=100  # Перекрытие между чанками
    )
    split_docs = text_splitter.split_documents(docs)
    return split_docs

# Документы по Специалисту аналитику
split_docs_1 = create_docs_from_txt(folder_path_1)
# Документы по Лиду аналитику
split_docs_2 = create_docs_from_txt(folder_path_2)
# Документы по PO/PM
split_docs_3 = create_docs_from_txt(folder_path_3)
# Полный пакет
split_docs_full = create_docs_from_txt(folder_path_full)

# Инициализация модели для эмбеддингов
model_name = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
model_kwargs = {'device': 'cpu'}
encode_kwargs = {'normalize_embeddings': False}
embedding = HuggingFaceEmbeddings(
    model_name=model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

# Создание векторного хранилища 1
vector_store_1 = FAISS.from_documents(split_docs_1, embedding=embedding)
embedding_retriever_1 = vector_store_1.as_retriever(search_kwargs={"k": 5})

# Создание векторного хранилища 2
vector_store_2 = FAISS.from_documents(split_docs_2, embedding=embedding)
embedding_retriever_2 = vector_store_2.as_retriever(search_kwargs={"k": 5})

# Создание векторного хранилища 3
vector_store_3 = FAISS.from_documents(split_docs_3, embedding=embedding)
embedding_retriever_3 = vector_store_3.as_retriever(search_kwargs={"k": 5})

# Создание векторного хранилища со всеми данными
vector_store_full = FAISS.from_documents(split_docs_full, embedding=embedding)
embedding_retriever_full = vector_store_full.as_retriever(search_kwargs={"k": 5})


# Инициализация модели GigaChat

def create_retrieval_chain_from_folder(role, specialization, question_id, embedding_retriever, prompt_template):
    
    # Заполнение шаблона промпта
    template = string.Template(prompt_template)
    filled_prompt = template.substitute(role=role, specialization=specialization)

    # Создание промпта
    prompt = ChatPromptTemplate.from_template(filled_prompt)

    llm = GigaChat(
        credentials=api_key,
        model='GigaChat',
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
        model='GigaChat',
        verify_ssl_certs=False,
        profanity_check=False
    )
    
    try:
        print(f"ws_suggest: Invoking GigaChat with prompt...")
        response = await llm.ainvoke(filled_prompt)
        print(f"ws_suggest: GigaChat raw response: {response.content}")
        
        # Удаляем нумерацию, чтобы обеспечить корректный парсинг
        cleaned_response = re.sub(r'^\s*\d+\.\s*', '', response.content, flags=re.MULTILINE)
        questions = [q.strip() for q in cleaned_response.split('\n') if q.strip()]
        print(f"ws_suggest: Parsed questions: {questions}")

        await websocket.send_text(json.dumps(questions))
        print(f"ws_suggest: Sent questions to client: {json.dumps(questions)}")
    except Exception as e:
        print(f"ws_suggest: ERROR in GigaChat call: {e}")
        await websocket.send_text(json.dumps({"error": str(e)}))
    finally:
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
    question_id = int(question_id)
    count = int(count)
    print(question)
    print(role)
    print(specialization)
    print(f"количество {count}")
    print(f"айди {question_id}")
    prompt_template = get_prompt_from_db(question_id)
    if not prompt_template:
        prompt_template = get_prompt_from_db(777)
    
    # Выбираем соответствующий retriever в зависимости от question_id
    embedding_retriever = embedding_retriever_full
    if question_id in [1, 2, 3, 22, 23, 24]:
        embedding_retriever = embedding_retriever_1
    elif question_id in [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]:
        embedding_retriever = embedding_retriever_2
    elif question_id in [14, 15, 16, 17, 18, 19, 20]:
        embedding_retriever = embedding_retriever_3
    elif question_id in [21]:
        embedding_retriever = embedding_retriever_full

    # Создаем retrieval_chain только для вопросов, которые его используют (НЕ для ID=888)
    retrieval_chain = None
    if question_id != 888:
        retrieval_chain = create_retrieval_chain_from_folder(
            role=role,
            specialization=specialization,
            question_id=question_id,
            embedding_retriever=embedding_retriever,
            prompt_template=prompt_template
        )
    
    unwanted_chars = ["*", "**"]
    
    # Специальная обработка для свободного ввода с ID=888
    if question_id == 888:
        # Используем GigaChat напрямую с промптом и контекстом
        print(f"Обрабатываем свободный вопрос (ID=888) с контекстом: {context[:100]}...")
        
        # Формируем промпт с контекстом
        template = string.Template(prompt_template)
        filled_prompt = template.substitute(
            role=role,
            specialization=specialization
        )
        
        # Добавляем контекст диалога если есть
        if context and context != "[]":
            context_info = f"\n\nКонтекст предыдущих сообщений:\n{context}\n\n"
            full_prompt = filled_prompt + context_info + f"Вопрос пользователя: {question}"
        else:
            full_prompt = filled_prompt + f"\n\nВопрос пользователя: {question}"
        
        print("\n--- PROMPT ДЛЯ LLM ---\n")
        print(full_prompt)
        print("\n--- КОНЕЦ PROMPT ---\n")
        
        try:
            print("Начинаем стриминг ответа от GigaChat...")
            chunk_count = 0
            # Используем GigaChat для ответа
            async for chunk in GigaChat(
                credentials=api_key,
                verify_ssl_certs=False,
                model='GigaChat'
            ).astream(full_prompt):
                if chunk and chunk.content:
                    chunk_count += 1
                    answer = chunk.content.strip()
                    
                    # Заменяем ненужные символы
                    for char in unwanted_chars:
                        answer = answer.replace(char, " ")
                        
                    answer = " ".join(answer.split())  # Удаляем лишние пробелы
                    
                    print(f"Отправляем chunk #{chunk_count}: {answer[:50]}...")
                    await websocket.send_text(answer)
            
            print(f"Стриминг завершен. Всего отправлено chunks: {chunk_count}")
            if chunk_count == 0:
                print("ВНИМАНИЕ: GigaChat не вернул ни одного chunk!")
                await websocket.send_text("Извините, не удалось получить ответ. Попробуйте переформулировать вопрос.")
                
        except Exception as e:
            print(f"ОШИБКА при работе с GigaChat для ID=888: {e}")
            await websocket.send_text(f"Произошла ошибка при обработке вопроса: {str(e)}")
    
    elif (count == 1):
        async for chunk in retrieval_chain.astream({'input': question}):
            if chunk:
                    # Извлекаем ответ
                answer = chunk.get("answer", "").strip()

                    # Заменяем ненужные символы
                for char in unwanted_chars:
                    answer = answer.replace(char, " ")
                    
                answer = " ".join(answer.split())  # Удаляем лишние пробелы
                    
                await websocket.send_text(answer)  # Отправляем очищенный текстовый ответ

    elif(count > 1 and count < 10):
        for chunk in GigaChat(credentials=api_key,
                              verify_ssl_certs=False,
                                model='GigaChat-Max'
                                ).stream(f"Использую контекст нашей прошлой беседы {context}, ответь на уточняющий вопрос {question}"):
            answer = chunk.content.strip()  # Используем атрибут .content

            # Заменяем ненужные символы
            for char in unwanted_chars:
                answer = answer.replace(char, " ")

            # Удаляем лишние пробелы
            answer = " ".join(answer.split())

            # Отправляем ответ через WebSocket
            await websocket.send_text(answer)


    elif(count == 101):
        for chunk in GigaChat(credentials=api_key,
                              verify_ssl_certs=False,
                                model='GigaChat'
                                ).stream(f"Использую историю нашей с тобой беседы {context}, придумай мне тему для обсуждения"):
            answer = chunk.content.strip()  # Используем атрибут .content

            # Заменяем ненужные символы
            for char in unwanted_chars:
                answer = answer.replace(char, " ")

            # Удаляем лишние пробелы
            answer = " ".join(answer.split())

            # Отправляем ответ через WebSocket
            await websocket.send_text(answer)
        

    elif(count == 102):
        print("zashlo")
        for chunk in GigaChat(credentials=api_key,
                              verify_ssl_certs=False,
                                model='GigaChat'
                                ).stream(f"Напомни мне пожалуйста вот об этой теме {context}"):
            answer = chunk.content.strip()  # Используем атрибут .content

            # Заменяем ненужные символы
            for char in unwanted_chars:
                answer = answer.replace(char, " ")

            # Удаляем лишние пробелы
            answer = " ".join(answer.split())

            # Отправляем ответ через WebSocket
            await websocket.send_text(answer)
            
    await websocket.close()

if __name__ == "__main__":
    print("Запускаем сервер на ws://127.0.0.1:8000/ws")
    uvicorn.run(app, host="0.0.0.0", port=8000)

class DatabaseOperations:
    def __init__(self, db_path=DATABASE_URL):
        self.db_path = db_path

    # Пользователи
    def get_all_users(self):
        """Получение всех пользователей с их статистикой"""
        query = """
        SELECT u.*, 
               COUNT(DISTINCT m.message) as message_count,
               MAX(m.time) as last_activity
        FROM Users u
        LEFT JOIN Message_history m ON u.user_id = m.user_id
        GROUP BY u.user_id
        """
        # Реализация запроса

    # Промпты
    def get_all_prompts(self):
        """Получение всех промптов"""
        query = "SELECT * FROM Prompts ORDER BY created_at DESC"
        # Реализация запроса

    def add_prompt(self, question_text, prompt_template):
        """Добавление нового промпта"""
        query = """
        INSERT INTO Prompts (question_text, prompt_template)
        VALUES (?, ?)
        """
        # Реализация запроса

    def update_prompt(self, question_id, question_text, prompt_template):
        """Обновление промпта"""
        query = """
        UPDATE Prompts 
        SET question_text = ?, prompt_template = ?
        WHERE question_id = ?
        """
        # Реализация запроса

    def delete_prompt(self, question_id):
        """Удаление промпта"""
        query = "DELETE FROM Prompts WHERE question_id = ?"
        # Реализация запроса

    # История сообщений
    def get_user_messages(self, user_id):
        """Получение истории сообщений пользователя"""
        query = """
        SELECT * FROM Message_history 
        WHERE user_id = ? 
        ORDER BY time DESC
        """
        # Реализация запроса

class RAGDocumentManager:
    def __init__(self, base_path="app/src/main_version/txt_docs"):
        self.base_path = base_path
        self.packs = {
            "pack_1": os.path.join(base_path, "docs_pack_1"),
            "pack_2": os.path.join(base_path, "docs_pack_2"),
            "pack_3": os.path.join(base_path, "docs_pack_3"),
            "pack_full": os.path.join(base_path, "docs_pack_full")
        }

    def get_all_documents(self):
        """Получение списка всех документов по всем пакетам"""
        documents = {}
        for pack_name, pack_path in self.packs.items():
            documents[pack_name] = [
                f for f in os.listdir(pack_path) 
                if f.endswith('.txt')
            ]
        return documents

    def add_document(self, file_content, filename, pack_name):
        """Добавление нового документа в указанный пакет"""
        if pack_name not in self.packs:
            raise ValueError(f"Неверное имя пакета: {pack_name}")
        
        file_path = os.path.join(self.packs[pack_name], filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(file_content)
        
        # Также добавляем в pack_full
        full_path = os.path.join(self.packs["pack_full"], filename)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(file_content)

    def delete_document(self, filename, pack_name):
        """Удаление документа из указанного пакета"""
        if pack_name not in self.packs:
            raise ValueError(f"Неверное имя пакета: {pack_name}")
        
        file_path = os.path.join(self.packs[pack_name], filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Также удаляем из pack_full
        full_path = os.path.join(self.packs["pack_full"], filename)
        if os.path.exists(full_path):
            os.remove(full_path)

    def read_document(self, filename, pack_name):
        """Чтение содержимого документа"""
        if pack_name not in self.packs:
            raise ValueError(f"Неверное имя пакета: {pack_name}")
        
        file_path = os.path.join(self.packs[pack_name], filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {filename}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def update_document(self, file_content, filename, pack_name):
        """Обновление содержимого документа"""
        self.delete_document(filename, pack_name)
        self.add_document(file_content, filename, pack_name)
