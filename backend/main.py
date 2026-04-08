from flask import Flask, request
import db.DataBaseSetup as s

app = Flask(__name__)
setup = s.Setup()
setup.initialize()
@app.route("/register", methods=["POST"])
def register():
    registerData = request.get_json()
    name = registerData["name"]
    surname = registerData["surname"]
    email = registerData["email"]
    password = registerData["password"]
    avatar = registerData["avatar"]
    setup.addUser(name, surname, email, password, avatar)
    return "Rejestracja zakończona pomyślnie"

@app.route("/login", methods=["POST"])
def login():
    loginData = request.get_json()
    email = loginData["email"]
    password = loginData["password"]
    if setup.checkUser(email, password):
        return "Zalogowano pomyślnie"
    else:
        return "Zły adres email lub hasło"

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

