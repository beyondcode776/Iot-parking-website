#define IR_SENSOR 4
#define TRIG 9
#define ECHO 10
#define RED 2
#define GREEN 3

long duration;
int distance;

void setup() {
  pinMode(IR_SENSOR, INPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(RED, OUTPUT);
  pinMode(GREEN, OUTPUT);

  Serial.begin(9600);
}

void loop() {

  // -------- Ultrasonic --------
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH, 30000); // timeout added
  distance = duration * 0.034 / 2;

  // -------- IR Sensor --------
  int ir = digitalRead(IR_SENSOR);

  // -------- Debug --------
  Serial.print("IR: ");
  Serial.print(ir);
  Serial.print(" | Distance: ");
  Serial.println(distance);

  String status;

  // -------- SMART LOGIC --------
  // IR = main sensor
  // Ultrasonic = support (only if valid reading)

  if (ir == LOW) {
    // IR detects object → occupied
    status = "occupied";

    digitalWrite(RED, HIGH);
    digitalWrite(GREEN, LOW);
  }
  else if (distance > 0 && distance < 20) {
    // fallback if IR fails but ultrasonic detects
    status = "occupied";

    digitalWrite(RED, HIGH);
    digitalWrite(GREEN, LOW);
  }
  else {
    status = "Not Occupied";

    digitalWrite(RED, LOW);
    digitalWrite(GREEN, HIGH);
  }

  // -------- Send to Website --------
  Serial.println(status);

  delay(800);
}