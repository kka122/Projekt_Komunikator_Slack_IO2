import os
from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
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

@workspace_route.route('/api/workspaces', methods=['POST'])
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

    try:
        intent = stripe.PaymentIntent.create(amount = WORKSPACE_PRICE_GROSZE,currency=CURRENCY,metadata={"owner_email":email,"workspace_name":workspace_name},automatic_payment_methods={"enabled": True, "allow_redirects": "never"},)
    except stripe.error.StripeError as e:
        print(f"[Workspace] Blad Stripe przy tworzeniu PaymentIntent: {e}")
        return jsonify({"error": "Nie udalo sie zainicjowac platnosci"}), 502

    return jsonify({"clientSecret": intent.client_secret}), 201

@workspace_route.route('/api/workspaces/accept-payment', methods=['POST'])
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

    if (intent.metadata or {}).get("owner_email") != email:
        return jsonify({"error": "Brak dostepu do tej platnosci"}), 403

    if intent.status != "succeeded":
          return jsonify({"error": "Platnosc nie zostala zakonczona"}), 402

    workspace_name = (intent.metadata or {}).get("workspace_name") or "Workspace"
    try:
        publish_workspace_create({
            "workspace_name": workspace_name,
            "owner_email": email,
            "stripe_payment_intent_id": payment_intent_id,
        })
    except KafkaError as e:
        print(f"[Workspace] Kafka niedostepna: {e}")
        return jsonify({"error": "Usluga chwilowo niedostepna, sprobuj ponownie"}), 503

    return jsonify({"status": "processing", "paymentIntentId": payment_intent_id}), 202
