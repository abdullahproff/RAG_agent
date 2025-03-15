"""
Модуль для управления фоновыми процессами Python-скриптов.

Этот модуль предоставляет функциональность для запуска и управления несколькими
Python-скриптами в фоновом режиме. Он использует subprocess.Popen для создания
отдельных процессов, что позволяет запускать скрипты параллельно.

Основные компоненты:
    - run_script_in_background: Функция для запуска скрипта в фоновом режиме
    - Автоматический запуск RAG-сервиса и Telegram-бота при выполнении модуля

Пример использования:
    $ python main.py

При запуске модуля как основной программы, он автоматически запустит:
    1. RAG-сервис (rag_service.py)
    2. Telegram-бот (telegram_bot.py)

Зависимости:
    - subprocess: Для управления процессами
    - sys: Для доступа к интерпретатору Python
"""

import subprocess
import sys

# Пути к скриптам, которые нужно запустить
script1 = "rag_service.py"
script2 = "telegram_bot.py"


def run_script_in_background(script_path):
    """
    Запускает Python-скрипт в фоновом режиме как отдельный процесс.

    Args:
        script_path (str): Путь к Python-скрипту, который необходимо запустить.

    Returns:

        subprocess.Popen | None: Объект процесса, если скрипт успешно запущен,
        или None в случае ошибки.

    Raises:
        Exception: Перехватывает и логирует любые исключения, возникающие при запуске скрипта.

    Example:
        >>> process = run_script_in_background('my_script.py')
        >>> if process:
        >>>     print(f"Скрипт запущен с PID: {process.pid}")
    """
    try:
        # Запуск скрипта в фоновом режиме с использованием Popen
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        print(f"Скрипт {script_path} запущен в фоновом режиме с PID: {process.pid}")
        return process
    except Exception as e:
        print(f"Ошибка при запуске скрипта {script_path}: {e}")
        return None


# Запуск скриптов в фоновом режиме
if __name__ == "__main__":
    process1 = run_script_in_background(script1)
    process2 = run_script_in_background(script2)
