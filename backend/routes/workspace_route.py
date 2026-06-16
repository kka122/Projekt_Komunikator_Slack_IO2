import os
import uuid
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
from kafka.errors import KafkaError
from db.DataBaseSetupInitialize import setup
from kafka_producer import publish_workspace_create


load_dotenv('./.env')
load_dotenv('../.env')

workspace_route = Blueprint('workspace_route', __name__)

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
WORKSPACE_PRICE_GROSZE = 2000
CURRENCY = "pln"

LOGO_UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "logos"))

@workspace_route.route('/workspaces', methods=['POST'])
@jwt_required()
def create_workspace():
    email = get_jwt_identity()

    workspace_name = request.form.get("workspaceName")
    if not workspace_name or not workspace_name.strip():
        return jsonify({"error": "Nazwa workspace jest wymagana"}), 400
    workspace_name = workspace_name.strip()

    if setup.getUserByEmail(email) is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    if not stripe.api_key:
        return jsonify({"error": "Brak STRIPE_SECRET_KEY"}), 500

    logo_url = ""
    logo = request.files.get("workspaceLogo")
    if logo is not None and logo.filename:
        try:
            os.makedirs(LOGO_UPLOAD_DIR, exist_ok=True)
            filename = f"{uuid.uuid4().hex}{os.path.splitext(logo.filename)[1]}"
            logo.save(os.path.join(LOGO_UPLOAD_DIR, filename))
            logo_url = f"/api/uploads/logos/{filename}"
        except OSError as e:
            print(f"[Workspace] Blad zapisu logo: {e}")
            return jsonify({"error": "Nie udalo sie zapisac logo"}), 500

    try:
        intent = stripe.PaymentIntent.create(amount = WORKSPACE_PRICE_GROSZE,currency=CURRENCY,metadata={"owner_email":email,"workspace_name":workspace_name,"logo_url":logo_url},automatic_payment_methods={"enabled": True, "allow_redirects": "never"},)
    except stripe.error.StripeError as e:
        print(f"[Workspace] Blad Stripe przy tworzeniu PaymentIntent: {e}")
        return jsonify({"error": "Nie udalo sie zainicjowac platnosci"}), 502

    return jsonify({"clientSecret": intent.client_secret}), 201

@workspace_route.route('/workspaces/accept-payment', methods=['POST'])
@jwt_required()
def accept_workspace_payment():
    email = get_jwt_identity()

    data = request.get_json(force = True, silent = True) or {}
    payment_intent_id = data.get("paymentIntentId")
    if not payment_intent_id:
        return jsonify({"error": "Brak paymentIntentId"}), 400

    if not stripe.api_key:
        return jsonify({"error": "Brak STRIPE_SECRET_KEY"}), 500

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    except stripe.error.StripeError as e:
        print(f"[Workspace] Blad retrieve PaymentIntent: {e}")
        return jsonify({"error": "Nieprawidlowy identyfikator platnosci"}), 400

    metadata = intent.metadata.to_dict() if intent.metadata else {}
    if metadata.get("owner_email") != email:
        return jsonify({"error": "Brak dostepu do tej platnosci"}), 403

    if intent.status != "succeeded":
          return jsonify({"error": "Platnosc nie zostala zakonczona"}), 402

    workspace_name = metadata.get("workspace_name") or "Workspace"
    logo_url = metadata.get("logo_url") or ""
    try:
        publish_workspace_create({
            "workspace_name": workspace_name,
            "owner_email": email,
            "stripe_payment_intent_id": payment_intent_id,
            "logo_url": logo_url,
        })
    except KafkaError as e:
        print(f"[Workspace] Kafka niedostepna: {e}")
        return jsonify({"error": "Usluga chwilowo niedostepna, sprobuj ponownie"}), 503

    return jsonify({"status": "processing", "paymentIntentId": payment_intent_id}), 202

@workspace_route.route('/workspaces', methods=['GET'])
@jwt_required()
def list_workspaces():
    email = get_jwt_identity()

    if setup.getUserByEmail(email) is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    workspaces = setup.listUserWorkspaces(email)
    return jsonify({"workspaces": workspaces}), 200

@workspace_route.route('/workspaces/<workspaceId>', methods=['DELETE'])
@jwt_required()
def delete_workspace(workspaceId):
    email = get_jwt_identity()
    try:
        setup.deleteWorkspace(workspaceId, email)
        return jsonify({"message": "Workspace zostal usuniety"}), 200
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except (ValueError, LookupError) as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"Wystapil blad podczas usuwania workspace: {str(e)}"}), 500

@workspace_route.route('/workspaces/<workspaceId>', methods=['PATCH'])
@jwt_required()
def update_workspace_logo(workspaceId):
    email = get_jwt_identity()

    try:
        workspace_id = int(workspaceId)
    except ValueError:
        return jsonify({"error": "Nieprawidlowy format ID"}), 400

    requester = setup.getUserByEmail(email)
    if requester is None:
        return jsonify({"error": "Uzytkownik nie istnieje"}), 401

    if setup.getWorkspaceById(workspace_id) is None:
        return jsonify({"error": "Workspace nie istnieje"}), 404

    if setup.getWorkspaceRole(requester.id, workspace_id) != "owner":
        return jsonify({"error": "Tylko wlasciciel workspace moze zmienic logo"}), 403

    logo = request.files.get("workspaceLogo")
    if logo is None or not logo.filename:
        return jsonify({"error": "Plik workspaceLogo jest wymagany"}), 400

    try:
        os.makedirs(LOGO_UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4().hex}{os.path.splitext(logo.filename)[1]}"
        logo.save(os.path.join(LOGO_UPLOAD_DIR, filename))
        logo_url = f"/api/uploads/logos/{filename}"
    except OSError as e:
        print(f"[Workspace] Blad zapisu logo: {e}")
        return jsonify({"error": "Nie udalo sie zapisac logo"}), 500

    setup.updateWorkspaceLogo(workspaceId=workspace_id, logoUrl=logo_url)
    return jsonify({"message": "Logo zostalo zaktualizowane"}), 200

@workspace_route.route('/uploads/logos/<filename>', methods=['GET'])
def get_workspace_logo(filename):
    return send_from_directory(LOGO_UPLOAD_DIR, filename)
