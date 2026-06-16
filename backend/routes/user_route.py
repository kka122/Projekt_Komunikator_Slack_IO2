import os
import uuid
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import DataError
from db.DataBaseSetupInitialize import setup
from db.DataTypes import UserStatus
from realtime import events as rt

load_dotenv('./.env')
load_dotenv('../.env')

user_route = Blueprint('user_route', __name__)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "avatars"))

def user_to_dict(user):
    return {
        "id": str(user.id),
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "avatarUrl": user.avatarUrl,
        "status": user.status.value,
    }

@user_route.route("/users/me", methods=["GET"])
@jwt_required()
def get_current_user_profile():
    email = get_jwt_identity()

    user = setup.getUserByEmail(email)
    if user is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 404

    return jsonify({"user": user_to_dict(user)}), 200

@user_route.route("/users/me", methods=["PATCH"])
@jwt_required()
def update_current_user_profile():
    email = get_jwt_identity()

    name = request.form.get("name")
    surname = request.form.get("surname")
    form_email = request.form.get("email")
    status = request.form.get("status")

    if not name or not name.strip() or not surname or not surname.strip() or not form_email or not status:
        return jsonify({"error": "Pola name, surname, email i status sa wymagane"}), 400

    if status not in [s.value for s in UserStatus]:
        return jsonify({"error": "Nieprawidlowa wartosc statusu"}), 400

    avatar_url = None
    avatar = request.files.get("avatar")
    if avatar and avatar.filename:
        try:
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            filename = f"{uuid.uuid4().hex}{os.path.splitext(avatar.filename)[1]}"
            avatar.save(os.path.join(UPLOAD_DIR, filename))
            avatar_url = f"/api/uploads/avatars/{filename}"
        except OSError as e:
            print(f"[User] Blad zapisu avatara: {e}")
            return jsonify({"error": "Nie udalo sie zapisac avatara"}), 500

    if not setup.updateUserProfile(email=email, name=name.strip(), surname=surname.strip(), status=status,avatarUrl=avatar_url):
        return jsonify({"error": "Uzytkownik nie istnieje"}), 404

    # Fan the change out so other members see the new status/name/avatar live.
    user = setup.getUserByEmail(email)
    if user is not None:
        rt.user_profile_changed(user.id, setup.getUserWorkspaceIds(email))

    return jsonify({"message": "Profil zaktualizowany pomyslnie"}), 200


@user_route.route('/users/me', methods=['DELETE'])
@jwt_required()
def delete_current_user_account():
    email = get_jwt_identity()

    if not setup.deleteUserAccount(email):
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    return jsonify({"message": "Konto zostalo usuniete"}), 200


@user_route.route('/users/<emailRegex>', methods=['GET'])
@jwt_required()
def get_users_by_email(emailRegex):
    email = get_jwt_identity()

    requester = setup.getUserByEmail(email)
    if requester is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    if not setup.isOwnerOrAdminAnywhere(requester.id):
        return jsonify({"error": "Tylko wlasciciele i administratorzy moga wyszukiwac uzytkownikow"}), 403

    try:
        users = setup.searchUsersByEmail(emailRegex)
    except DataError as e:
        print(f"[User] Nieprawidlowy regex: {e}")
        return jsonify({"error": "Nieprawidlowe wyrazenie regularne"}), 400

    return jsonify({"users": [user_to_dict(u) for u in users]}), 200

@user_route.route('/users/<userId>/workspaces/<workspaceId>', methods=['POST'])
@jwt_required()
def add_user_to_workspace(userId, workspaceId):
    email = get_jwt_identity()

    try:
        user_id = int(userId)
        workspace_id = int(workspaceId)
    except ValueError:
        return jsonify({"error": "Nieprawidlowy format ID"}), 400

    requester = setup.getUserByEmail(email)
    if requester is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    if setup.getWorkspaceById(workspace_id) is None:
        return jsonify({"error": "Workspace nie istnieje"}), 404

    if setup.getWorkspaceRole(requester.id, workspace_id) != "owner":
        return jsonify({"error": "Tylko wlasciciel workspace moze dodawac uzytkownikow"}), 403

    if requester.id == user_id:
        return jsonify({"error": "Nie mozesz dodac samego siebie do workspace"}), 400

    if setup.getUserById(user_id) is None:
        return jsonify({"error": "Docelowy uzytkownik nie istnieje"}), 404

    if setup.getWorkspaceRole(user_id, workspace_id) is not None:
        return jsonify({"error": "Uzytkownik jest juz czlonkiem workspace"}), 400

    setup.addUserToWorkspace(workspaceId=workspace_id, userId=user_id)
    rt.workspace_changed(workspace_id)        # existing members see the new member
    rt.user_workspaces_changed(user_id)       # the added user sees the new workspace
    return jsonify({"message": "Uzytkownik zostal dodany do workspace"}), 200

@user_route.route('/users/<userId>/workspaces/<workspaceId>', methods=['DELETE'])
@jwt_required()
def remove_user_from_workspace(userId, workspaceId):
    email = get_jwt_identity()

    try:
        user_id = int(userId)
        workspace_id = int(workspaceId)
    except ValueError:
        return jsonify({"error": "Nieprawidlowy format ID"}), 400

    requester = setup.getUserByEmail(email)
    if requester is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    if setup.getWorkspaceById(workspace_id) is None:
        return jsonify({"error": "Workspace nie istnieje"}), 404

    if setup.getWorkspaceRole(requester.id, workspace_id) != "owner":
        return jsonify({"error": "Tylko wlasciciel workspace moze usuwac uzytkownikow"}), 403

    if requester.id == user_id:
        return jsonify({"error": "Nie mozesz usunac samego siebie z workspace"}), 400

    if setup.getWorkspaceRole(user_id, workspace_id) is None:
        return jsonify({"error": "Uzytkownik nie jest czlonkiem tego workspace"}), 404

    setup.removeUserFromWorkspace(workspaceId=workspace_id, userId=user_id)
    rt.workspace_changed(workspace_id)        # remaining members see the updated list
    rt.user_workspaces_changed(user_id)       # the removed user loses the workspace
    return jsonify({"message": "Uzytkownik zostal usuniety z workspace"}), 200


@user_route.route('/users/<userId>/workspaces/<workspaceId>/role', methods=['PATCH'])
@jwt_required()
def update_user_role_in_workspace(userId, workspaceId):
    email = get_jwt_identity()

    data = request.get_json(force=True, silent=True) or {}
    role = data.get("role")
    if role not in ("admin", "member"):
        return jsonify({"error": "Rola musi byc jedna z: admin, member"}), 400

    try:
        user_id = int(userId)
        workspace_id = int(workspaceId)
    except ValueError:
        return jsonify({"error": "Nieprawidlowy format ID"}), 400

    requester = setup.getUserByEmail(email)
    if requester is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    if setup.getWorkspaceById(workspace_id) is None:
        return jsonify({"error": "Workspace nie istnieje"}), 404

    if setup.getWorkspaceRole(requester.id, workspace_id) != "owner":
        return jsonify({"error": "Tylko wlasciciel workspace moze zmieniac role"}), 403

    if requester.id == user_id:
        return jsonify({"error": "Nie mozesz zmienic wlasnej roli"}), 400

    if not setup.updateUserRoleInWorkspace(workspaceId=workspace_id, userId=user_id, newRole=role):
        return jsonify({"error": "Uzytkownik nie jest czlonkiem tego workspace"}), 404

    rt.workspace_changed(workspace_id)
    return jsonify({"message": "Rola uzytkownika zostala zaktualizowana"}), 200

@user_route.route('/uploads/avatars/<filename>', methods=['GET'])
def get_avatar(filename):
    return send_from_directory(UPLOAD_DIR, filename)