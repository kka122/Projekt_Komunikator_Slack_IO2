import json
import os
from kafka import KafkaProducer

WORKSPACE_CREATE_TOPIC = "workspace-create"
producer = None

def get_producer():
    global producer
    if producer is None:
        producer = KafkaProducer(bootstrap_servers = os.environ.get('KAFKA_BOOTSTRAP_SERVERS', "localhost:9092"), value_serializer = lambda x: json.dumps(x).encode('utf-8'), acks = "all", retries = 3)

    return producer

def publish_workspace_create(event):
    producer = get_producer()
    future = producer.send(WORKSPACE_CREATE_TOPIC, value = event)
    future.get(timeout=10)
