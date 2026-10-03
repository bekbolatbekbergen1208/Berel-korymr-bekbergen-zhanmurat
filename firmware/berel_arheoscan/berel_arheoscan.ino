#include <WiFi.h>
#include <HTTPClient.h>
#include <math.h>
#include "config.h" // Copy config.example.h to config.h and edit it first.

// Transport + raw ADC example for original ESP32 DevKit. Not a validated resistivity instrument.
// Replace readSoilSignal() with your existing calibrated measurement algorithm when available.
constexpr int PIN_A=34, PIN_M=35, PIN_N=32, PIN_BUTTON=27, PIN_LED=2;
float baseline=0;
bool calibrated=false, previousButton=false;
unsigned long lastSend=0, lastWiFiAttempt=0;
float readSoilSignal(){
  float sum=0;
  for(int i=0;i<32;i++){
    const float m=analogReadMilliVolts(PIN_M);
    const float n=analogReadMilliVolts(PIN_N);
    sum += fabsf(m-n);
    delay(3);
  }
  // Relative ADC display scale only, not resistance or artifact identification.
  return constrain((sum/32.0f)/3100.0f*100.0f,0.0f,100.0f);
}
void setup(){
  Serial.begin(115200);pinMode(PIN_BUTTON,INPUT_PULLUP);pinMode(PIN_LED,OUTPUT);
  analogReadResolution(12);analogSetPinAttenuation(PIN_A,ADC_11db);
  analogSetPinAttenuation(PIN_M,ADC_11db);analogSetPinAttenuation(PIN_N,ADC_11db);
  WiFi.mode(WIFI_STA);WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
  Serial.println("Place electrodes in normal soil, then press GPIO27 button to calibrate.");
}
void loop(){
  const bool pressed=digitalRead(PIN_BUTTON)==LOW;
  if(pressed&&!previousButton){
    baseline=0;for(int i=0;i<5;i++)baseline+=readSoilSignal();baseline/=5.0f;
    calibrated=true;Serial.printf("Baseline: %.2f %%\n",baseline);
  }
  previousButton=pressed;
  if(WiFi.status()!=WL_CONNECTED){
    if(millis()-lastWiFiAttempt>10000){lastWiFiAttempt=millis();WiFi.reconnect();}
    delay(20);return;
  }
  if(!calibrated||millis()-lastSend<2000){delay(20);return;}
  lastSend=millis();const float signal=readSoilSignal();
  digitalWrite(PIN_LED,fabsf(signal-baseline)>=20.0f?HIGH:LOW);
  // No GPS coordinates are sent until a real GPS or verified manual location is added.
  String payload="{\"pointId\":\""+String(POINT_ID)+"\",\"signal\":"+String(signal,2)+",\"baseline\":"+String(baseline,2);
  if(strlen(MOUND_ID)>0)payload+=",\"moundId\":\""+String(MOUND_ID)+"\"";
  payload+="}";
  WiFiClient client;HTTPClient http;
  if(http.begin(client,SERVER_URL)){
    http.setConnectTimeout(3000);http.setTimeout(3000);
    http.addHeader("Content-Type","application/json");http.addHeader("X-Device-Token",DEVICE_TOKEN);
    const int code=http.POST(payload);Serial.printf("POST: %d | signal %.2f %%\n",code,signal);
    if(code>0&&code!=201)Serial.println(http.getString());
    http.end();
  }
}
