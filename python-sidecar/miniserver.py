from flask import Flask, request
import pyautogui

app = Flask(__name__)

@app.route("/click", methods=["POST"])
def click():
    x = int(request.json["x"])
    y = int(request.json["y"])
    pyautogui.click(x, y)
    return {"status": "ok"}

@app.route("/type", methods=["POST"])
def type_text():
    text = request.json["text"]
    pyautogui.typewrite(text)
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(port=5050)