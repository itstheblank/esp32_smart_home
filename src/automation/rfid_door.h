#ifndef RFID_DOOR_H
#define RFID_DOOR_H

class Rfid;
class Door;

// Automation rule (architecture.md §1 rule 2): couples the RFID device to the
// door device. Only a whitelisted (GRANTED) access event opens the door; the
// door publishes its own retained state.
void rfid_door_setup(Rfid &rfid, Door &door);
void rfid_door_loop();

#endif // RFID_DOOR_H
