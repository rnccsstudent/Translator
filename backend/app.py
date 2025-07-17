from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os

try:
    from googletrans import Translator
except ImportError:
    raise ImportError("Please install googletrans==4.0.0-rc1")

app = Flask(__name__)
CORS(app)

translator = Translator()
translation_count = 0

@app.route('/translate', methods=['POST'])
def translate_text():
    global translation_count
    try:
        data = request.get_json()
        text = data.get('text', '')
        source_lang = data.get('source', 'auto')
        target_lang = data.get('target', 'en')

        result = translator.translate(text, src=source_lang, dest=target_lang)
        translated_text = result.text

        translation_count += 1

        with open("translation_history.txt", "a", encoding="utf-8") as f:
            f.write(f"{source_lang.upper()} → {target_lang.upper()}\n")
            f.write(f"Input   : {text}\n")
            f.write(f"Output  : {translated_text}\n")
            f.write("-" * 40 + "\n")

        return jsonify({'translated_text': translated_text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def stats():
    return jsonify({'total_translations': translation_count})

@app.route('/download', methods=['GET'])
def download_history():
    file_path = os.path.join(os.getcwd(), 'translation_history.txt')
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return "History file not found", 404

@app.route('/clear-history', methods=['POST'])
def clear_history():
    try:
        open("translation_history.txt", "w", encoding="utf-8").close()
        return "History cleared", 200
    except Exception as e:
        return f"Error clearing history: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True)
