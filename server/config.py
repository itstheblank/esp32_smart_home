import os

class Config:
    """Server and MQTT Configuration Settings"""
    BROKER_HOST = os.getenv("MQTT_BROKER", "127.0.0.1")
    BROKER_PORT = int(os.getenv("MQTT_PORT", "1883"))
    WEB_HOST = os.getenv("WEB_HOST", "0.0.0.0")
    WEB_PORT = int(os.getenv("WEB_PORT", "5000"))

    # MQTT Topics
    TOPIC_CMD = "smarthome/cmd"
    TOPIC_LOGS = "smarthome/logs"

    CLIENT_ID = "SmartHome_Web_Service"
    MAX_LOG_HISTORY = 300
