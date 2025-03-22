import os
import re
import json

TARGET_URL = "https://nm-digitalhub.com/CRM"

patterns_to_replace = [
    r"http://localhost:\d+",
    r"http://127\.0\.0\.1:\d+",
    r"http://localhost",
    r"http://127\.0\.0\.1"
]

EXCLUDE_DIRS = {'node_modules', '.git', '__pycache__', 'dist', 'build', 'static'}
VALID_EXTENSIONS = {'.js', '.jsx', '.ts', '.tsx', '.env', '.json'}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"[!] Failed to read {filepath}: {e}")
        return

    original_content = content
    for pattern in patterns_to_replace:
        content = re.sub(pattern, TARGET_URL, content)

    if filepath.endswith('.env'):
        # נסרוק משתנים כמו API_URL או HOST
        content = re.sub(r'(API_URL|HOST)=.*', rf'\1={TARGET_URL}', content)

    if content != original_content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[✓] Updated: {filepath}")
        except Exception as e:
            print(f"[!] Failed to write {filepath}: {e}")

def update_proxy_in_package_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            package_data = json.load(f)

        original_proxy = package_data.get('proxy', '')
        if original_proxy != TARGET_URL:
            package_data['proxy'] = TARGET_URL
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(package_data, f, indent=2)
            print(f"[✓] 'proxy' updated in {filepath}")
    except Exception as e:
        print(f"[!] Failed to update proxy in {filepath}: {e}")

def scan_and_replace(root_path):
    for root, dirs, files in os.walk(root_path):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            _, ext = os.path.splitext(file)
            if ext in VALID_EXTENSIONS:
                filepath = os.path.join(root, file)
                if file == 'package.json' and 'server' not in root:  # רק package.json הראשי
                    update_proxy_in_package_json(filepath)
                else:
                    replace_in_file(filepath)

if __name__ == "__main__":
    print("== Starting Replacement Process ==")
    scan_and_replace(".")
    print("== Done. All replacements completed. ==")