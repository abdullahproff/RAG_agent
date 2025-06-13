from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_file, Response
from functools import wraps
import os
import sys
from datetime import datetime
import sqlite3
import requests

# Импортируем DatabaseOperations из локального файла
from database import DatabaseOperations
from rag_manager import RAGDocumentManager

app = Flask(__name__)
from werkzeug.middleware.proxy_fix import ProxyFix

app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_proto=1,
    x_host=1,
    x_port=1
)
app.secret_key = 'your-secret-key-here'  # Замените на реальный секретный ключ
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True

# Инициализация базы данных и менеджеров
db = DatabaseOperations()
rag_manager = RAGDocumentManager()

# Добавляем простой маршрут для проверки доступности сервера
@app.route('/ping')
def ping():
    response = Response('pong')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# Фильтр для форматирования даты
@app.template_filter('datetime')
def format_datetime(value):
    if not value:
        return ''
    if isinstance(value, str):
        try:
            # Пытаемся распарсить строку даты
            dt = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            return value
    try:
        # Если это timestamp
        return datetime.fromtimestamp(value).strftime('%Y-%m-%d %H:%M:%S')
    except (TypeError, ValueError):
        return str(value)

# Декоратор для проверки аутентификации
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Маршруты аутентификации
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        # Здесь должна быть проверка учетных данных
        if username == "admin_tg_bot" and password == "135beton531":  # Замените на реальную проверку
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            flash('Неверные учетные данные')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

# Главная страница
@app.route('/')
@login_required
def index():
    return render_template('index.html')

# Маршруты для работы с промптами
@app.route('/prompts')
@login_required
def prompts():
    all_prompts = db.get_all_prompts()
    print("Полученные промпты:", all_prompts)  # Отладочная информация
    if all_prompts is None:
        all_prompts = []  # Если нет промптов, используем пустой список
    return render_template('prompts.html', prompts=all_prompts)

@app.route('/prompts/add', methods=['GET', 'POST'])
@login_required
def add_prompt():
    if request.method == 'POST':
        question_id = request.form['question_id']
        question_text = request.form['question_text']
        prompt_template = request.form['prompt_template']
        
        try:
            db.add_prompt(int(question_id), question_text, prompt_template)
            flash('Промпт успешно добавлен')
            return redirect(url_for('prompts'))
        except sqlite3.IntegrityError:
            flash(f'Ошибка: Промпт с ID {question_id} уже существует')
        except ValueError:
            flash('Ошибка: ID вопроса должен быть числом')
        except Exception as e:
            flash(f'Ошибка при добавлении промпта: {str(e)}')
    
    return render_template('add_prompt.html')

# Добавляем новые маршруты для промптов
@app.route('/prompts/<int:prompt_id>', methods=['DELETE'])
@login_required
def delete_prompt(prompt_id):
    try:
        db.delete_prompt(prompt_id)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/prompts/<int:prompt_id>', methods=['GET', 'POST'])
@login_required
def edit_prompt(prompt_id):
    if request.method == 'POST':
        new_question_id = request.form['question_id']
        question_text = request.form['question_text']
        prompt_template = request.form['prompt_template']
        try:
            db.update_prompt(prompt_id, int(new_question_id), question_text, prompt_template)
            flash('Промпт успешно обновлен')
            return redirect(url_for('prompts'))
        except sqlite3.IntegrityError:
            flash(f'Ошибка: Промпт с ID {new_question_id} уже существует')
            return redirect(url_for('prompts'))
        except ValueError as e:
            flash(f'Ошибка: {str(e)}')
            return redirect(url_for('prompts'))
        except Exception as e:
            flash(f'Ошибка при обновлении промпта: {str(e)}')
            return redirect(url_for('prompts'))
    
    prompt = db.get_prompt(prompt_id)
    if prompt:
        return jsonify(prompt)
    return jsonify({'error': 'Промпт не найден'}), 404

# Маршруты для работы с RAG документами
@app.route('/documents')
@login_required
def documents():
    all_documents = rag_manager.get_all_documents()
    return render_template('documents.html', documents=all_documents)

@app.route('/documents/<pack>/<filename>', methods=['GET'])
@login_required
def get_document(pack, filename):
    try:
        content = rag_manager.get_document_content(filename, pack)
        return content
    except Exception as e:
        return str(e), 404

@app.route('/documents/<pack>/<filename>', methods=['DELETE'])
@login_required
def delete_document(pack, filename):
    try:
        rag_manager.delete_document(filename, pack)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/documents/add', methods=['POST'])
@login_required
def add_document():
    if 'file' not in request.files:
        flash('Не выбран файл')
        return redirect(url_for('documents'))
    
    file = request.files['file']
    if file.filename == '':
        flash('Не выбран файл')
        return redirect(url_for('documents'))
    
    pack_name = request.form.get('pack_name')
    if not pack_name:
        flash('Не выбран пакет')
        return redirect(url_for('documents'))
    
    try:
        content = file.read().decode('utf-8')
        rag_manager.add_document(content, file.filename, pack_name)
        flash('Документ успешно добавлен')
    except Exception as e:
        flash(f'Ошибка при добавлении документа: {str(e)}')
    
    return redirect(url_for('documents'))

# Маршруты для работы с пользователями
@app.route('/users')
@login_required
def users():
    # Получаем параметры из URL
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    sort_by = request.args.get('sort_by', 'last_activity')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Ограничиваем количество записей на странице
    if per_page > 100:
        per_page = 100
    if per_page < 5:
        per_page = 5
    
    users_data = db.get_all_users(page=page, per_page=per_page, sort_by=sort_by, sort_order=sort_order)
    return render_template('users.html', **users_data)

@app.route('/users/<int:user_id>')
@login_required
def user_details(user_id):
    user = db.get_user_details(user_id)
    if user:
        return jsonify(user)
    return jsonify({'error': 'Пользователь не найден'}), 404

# Маршруты для статистики
@app.route('/statistics')
@login_required
def statistics():
    # Получаем параметр периода из URL (по умолчанию 30 дней)
    days = request.args.get('days', 30, type=int)
    
    # Ограничиваем период разумными рамками
    if days < 1:
        days = 1
    elif days > 365:
        days = 365
    
    stats_data = db.get_statistics(days=days)
    return render_template('statistics.html', **stats_data)

# Маршруты для системных операций
@app.route('/system')
@login_required
def system():
    return render_template('system.html')

@app.route('/system/clear-cache', methods=['POST'])
@login_required
def clear_cache():
    try:
        # Делаем HTTP запрос к API бота
        response = requests.post('http://localhost:8007/clear-cache', timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return jsonify({'success': True, 'message': 'Кеш успешно очищен'})
            else:
                return jsonify({'success': False, 'error': data.get('error', 'Неизвестная ошибка')})
        else:
            return jsonify({'success': False, 'error': f'HTTP ошибка: {response.status_code}'})
    except requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'error': 'Не удается подключиться к боту. Убедитесь, что бот запущен.'})
    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Превышено время ожидания ответа от бота.'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Ошибка при очистке кеша: {str(e)}'})

@app.route('/system/send-message', methods=['POST'])
@login_required
def send_message():
    try:
        data = request.get_json()
        message = data.get('message')
        
        if not message:
            return jsonify({'success': False, 'error': 'Текст сообщения не указан'})
        
        # Делаем HTTP запрос к API бота
        response = requests.post(
            'http://localhost:8007/send-message',
            json={'message': message},
            timeout=30  # Увеличиваем таймаут, так как отправка может занять время
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return jsonify({'success': True, 'message': data.get('message', 'Сообщение успешно отправлено')})
            else:
                return jsonify({'success': False, 'error': data.get('error', 'Неизвестная ошибка')})
        else:
            return jsonify({'success': False, 'error': f'HTTP ошибка: {response.status_code}'})
    except requests.exceptions.ConnectionError:
        return jsonify({'success': False, 'error': 'Не удается подключиться к боту. Убедитесь, что бот запущен.'})
    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Превышено время ожидания ответа от бота.'})
    except Exception as e:
        return jsonify({'success': False, 'error': f'Ошибка при отправке сообщения: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8002) 
