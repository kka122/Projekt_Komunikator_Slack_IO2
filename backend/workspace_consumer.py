import json
import os
from dotenv import load_dotenv

load_dotenv('./.env')
load_dotenv('../.env')

from kafka import KafkaConsumer
from db.DataBaseSetupInitialize import setup
from kafka_producer import WORKSPACE_CREATE_TOPIC
from realtime import events as rt

def main():
    consumer = KafkaConsumer(WORKSPACE_CREATE_TOPIC,bootstrap_servers = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092"), group_id = "workspace-create-workers", value_deserializer=lambda m: json.loads(m.decode("UTF-8")),auto_offset_reset="earliest",enable_auto_commit=False)
    print(f"[Consumer] Start, nasluchuje topicu: {WORKSPACE_CREATE_TOPIC}")

    for message in consumer:
        event = message.value
        try:
            workspace, created = setup.createWorkspace(name=event["workspace_name"],ownerEmail=event["owner_email"],stripePaymentIntentId=event["stripe_payment_intent_id"],logoUrl=event.get("logo_url", ""),)
            print(f"[Consumer] OK: workspace id = {workspace.id} created={created}")
            consumer.commit()
            # Push the freshly-created workspace to the owner's open tabs (via Kafka
            # message queue → web workers → owner's user room).
            owner = setup.getUserByEmail(event["owner_email"])
            if owner is not None:
                rt.user_workspaces_changed(owner.id)
        except Exception as e:
            print(f"[Consumer] ERROR: {e}")

if __name__ == "__main__":
    main()