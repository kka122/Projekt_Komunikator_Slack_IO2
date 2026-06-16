import json
import os
from dotenv import load_dotenv

load_dotenv('./.env')
load_dotenv('../.env')

from kafka import KafkaConsumer
from db.DataBaseSetupInitialize import setup
from kafka_producer import WORKSPACE_CREATE_TOPIC

def main():
    consumer = KafkaConsumer(WORKSPACE_CREATE_TOPIC,bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"), group_id = "workspace-create-workers", value_deserializer=lambda m: json.loads(m.decode("UTF-8")),auto_offset_reset="earliest",enable_auto_commit=False)
    print(f"[Consumer] Start, nasluchuje topicu: {WORKSPACE_CREATE_TOPIC}")

    for message in consumer:
        event = message.value
        try:
            workspace, created = setup.createWorkspace(name=event["workspace_name"],ownerEmail=event["owner_email"],stripePaymentIntentId=event["stripe_payment_intent_id"],)
            print(f"[Consumer] OK: workspace id = {workspace.id} created={created}")
            consumer.commit()
        except Exception as e:
            print(f"[Consumer] ERROR: {e}")

if __name__ == "__main__":
    main()