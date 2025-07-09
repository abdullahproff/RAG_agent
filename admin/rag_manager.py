import os
from typing import Dict, List

class RAGDocumentManager:
    def __init__(self, base_path: str = 'src/main_version/docs'):
        self.base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', base_path))
        # Формируем словарь пакетов динамически: все директории, начинающиеся на
        # "docs_pack_" внутри base_path. Название пакета берём без префикса.
        self.packs = {}

        if os.path.isdir(self.base_path):
            for d in os.listdir(self.base_path):
                full_path = os.path.join(self.base_path, d)
                if os.path.isdir(full_path) and d.startswith("docs_pack_"):
                    pack_name = d  # оставляем оригинальное имя
                    self.packs[pack_name] = full_path

        # Создаём директории, если их нет
        for path in self.packs.values():
            os.makedirs(path, exist_ok=True)

    def get_all_documents(self) -> Dict[str, List[Dict]]:
        """Получение списка всех документов по всем пакетам"""
        documents = {}
        for pack_name, pack_path in self.packs.items():
            documents[pack_name] = []
            if os.path.exists(pack_path):
                for filename in os.listdir(pack_path):
                    if filename.endswith('.txt'):
                        file_path = os.path.join(pack_path, filename)
                        file_stat = os.stat(file_path)
                        documents[pack_name].append({
                            'filename': filename,
                            'size': file_stat.st_size,
                            'modified': file_stat.st_mtime,
                            'pack': pack_name
                        })
        return documents

    def add_document(self, content: str, filename: str, pack_name: str) -> None:
        """Добавление нового документа"""
        if pack_name not in self.packs:
            raise ValueError(f"Неверное имя пакета: {pack_name}")

        if not filename.endswith('.txt'):
            filename = f"{filename}.txt"

        # Сохраняем в указанный пакет
        file_path = os.path.join(self.packs[pack_name], filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

    def delete_document(self, filename: str, pack_name: str) -> None:
        """Удаление документа"""
        if pack_name not in self.packs:
            raise ValueError(f"Неверное имя пакета: {pack_name}")

        # Удаляем из указанного пакета
        file_path = os.path.join(self.packs[pack_name], filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    def get_document_content(self, filename: str, pack_name: str) -> str:
        """Получение содержимого документа"""
        if pack_name not in self.packs:
            raise ValueError(f"Неверное имя пакета: {pack_name}")

        file_path = os.path.join(self.packs[pack_name], filename)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {filename}")

        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def update_document(self, content: str, filename: str, pack_name: str) -> None:
        """Обновление содержимого документа"""
        self.delete_document(filename, pack_name)
        self.add_document(content, filename, pack_name) 