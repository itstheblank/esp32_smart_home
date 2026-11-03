#ifndef NETWORK_H
#define NETWORK_H

#include <Arduino.h>

void network_begin(const char *ssid, const char *password);
void network_loop();
bool network_connected();

#endif // NETWORK_H
