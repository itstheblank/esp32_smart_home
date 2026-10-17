# Dockerfile for EMQX MQTT Broker
# Project: ESP32 Smart Home
FROM emqx/emqx-enterprise:6.3.1

LABEL maintainer="Smart Home Team"
LABEL description="EMQX MQTT Broker for ESP32 Smart Home Project"

# Configure Node Name and Security Profile
# legacy profile allows anonymous MQTT connections within local/lab network
ENV EMQX_NODE_NAME=emqx@broker.smart-home.local
ENV EMQX_SECURITY_PROFILE=legacy

# Port 1883: Standard MQTT TCP Port (ESP32, Android app, MQTTX)
# Port 18083: EMQX Web Dashboard
EXPOSE 1883 18083
