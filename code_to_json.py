import json
import re
from bs4 import BeautifulSoup

def extract_templates_from_html(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    templates = []

    for tcont in soup.find_all("div", class_="template-container"):
        title = ""
        description = ""
        code = ""

        label = tcont.find("div", class_="template-label")
        if label:
            title = label.get_text(strip=True)

        # Find the first code block within the container
        code_elem = tcont.find("code")
        if code_elem:
            # Remove leading/trailing whitespace and preserve formatting
            code = code_elem.get_text()

        desc_elem = tcont.find("div", class_="description")
        if desc_elem:
            description = desc_elem.get_text(strip=True)

        if code:
            templates.append({
                "title": title,
                "description": description,
                "code": code
            })

    return templates

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python code_to_json_from_html.py index.html codes.json")
        exit(1)
    html_path = sys.argv[1]
    out_path = sys.argv[2]
    templates = extract_templates_from_html(html_path)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(templates, f, indent=2, ensure_ascii=False)
    print(f"Extracted {len(templates)} code blocks to {out_path}")