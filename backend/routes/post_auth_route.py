from flask import Blueprint,request
try:
    import db.DataBaseSetup as s
except:
    print("Blad ladowania bazy danych")

try:
    setup = s.Setup()
    setup.initialize()
except:
    print("Blad ladowania bazy danych")

post_auth_route = Blueprint('post_auth_route', __name__)

@post_auth_route.route('/api/auth/register', methods=['POST'])
def register():
    registerData = request.get_json()
    name = registerData["name"]
    surname = registerData["surname"]
    email = registerData["email"]
    password = registerData["password"]
    avatar = registerData["avatar"]
    setup.addUser(name, surname, email, password, avatar)
    return "Rejestracja zakończona pomyślnie"


@post_auth_route.route('/api/auth/login', methods=['POST'])
def login():
    loginData = request.get_json()
    email = loginData["email"]
    password = loginData["password"]
    if setup.checkUser(email, password):
        return "Zalogowano pomyślnie"
    else:
        return "Zły adres email lub hasło"


@post_auth_route.route('/api/auth/logout', methods=['POST'])
def logout_user():
    pass