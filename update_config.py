import os
import re

# כתובות להחלפה
REPLACEMENTS = {
    "localhost:3001": "https://nm-digitalhub.com/CRM/api",
    "http://localhost:3001": "https://nm-digitalhub.com/CRM/api",
    "ws://localhost:3001": "wss://nm-digitalhub.com/CRM/api",
    "127.0.0.1:3001": "https://nm-digitalhub.com/CRM/api",

    "localhost:3000": "https://nm-digitalhub.com/CRM",
    "http://localhost:3000": "https://nm-digitalhub.com/CRM",
    "ws://localhost:3000": "wss://nm-digitalhub.com/CRM",
    "127.0.0.1:3000": "https://nm-digitalhub.com/CRM",

    "API_BASE_URL = \"http://localhost:3001/api/files\"": "API_BASE_URL = \"https://nm-digitalhub.com/CRM/api/files\"",
    "API_BASE_URL = 'http://localhost:3001/api/files'": "API_BASE_URL = 'https://nm-digitalhub.com/CRM/api/files'"
}

# פונקציה להחלפת כתובות בקובץ מסוים
def update_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    updated_content = content
    for old, new in REPLACEMENTS.items():
        updated_content = re.sub(old, new, updated_content)

    if updated_content != content:
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(updated_content)
        print(f"✅ עדכון כתובות בקובץ: {file_path}")

# פונקציה לסרוק את כל הקבצים בתיקיות ולהפעיל את ההחלפה
def scan_and_update(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith((".js", ".jsx", ".ts", ".json", ".env")):  # עדכון קבצים רלוונטיים כולל JSX
                update_file(os.path.join(root, file))

# הפעלת הסקריפט בתיקיית הפרויקט
scan_and_update("./")
print("🚀 כל הכתובות הוחלפו בהצלחה!")