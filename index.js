const express = require('express');
const storage = require('node-persist');
const miio = require('miio');
require('dotenv').config();

const ThingSpeak = require('./thingSpeak');

const AirQualitySensor = require('./accessories/AirQualitySensor_accessory');
const XiaomiAirQualitySensor = require('./accessories/XiaomiAirQualitySensor_accessory');
const TemperatureSensor = require('./accessories/TemperatureSensor_accessory');
const XiaomiTemperatureSensor = require('./accessories/XiaomiTemperatureSensor_accessory');
const HumiditySensor = require('./accessories/HumiditySensor_accessory');
const XiaomiHumiditySensor = require('./accessories/XiaomiHumiditySensor_accessory');

const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/sds', function (req, res) {
  const { pm25, pm10 } = req.query;

  AirQualitySensor.updatePM25(pm25);
  AirQualitySensor.updatePM10(pm10);

  ThingSpeak.updatePM(pm25, pm10);

  res.send('done');
});

app.get('/dht', function (req, res) {
  const { temperature, humidity } = req.query;

  TemperatureSensor.updateTemperature(temperature);
  HumiditySensor.updateHumidity(humidity);

  ThingSpeak.updateTemperatureAndHumidity(temperature, humidity);

  res.send('done');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Initialize our storage system
storage.initSync();

// Our Accessories will each have their own HAP server; we will assign ports sequentially
let targetPort = 51826;

// Init sensors in Apple Home
AirQualitySensor.accessory.publish({
  port: targetPort++,
  username: AirQualitySensor.accessory.username,
  pincode: AirQualitySensor.accessory.pincode,
});

XiaomiAirQualitySensor.accessory.publish({
  port: targetPort++,
  username: XiaomiAirQualitySensor.accessory.username,
  pincode: XiaomiAirQualitySensor.accessory.pincode,
});

TemperatureSensor.accessory.publish({
  port: targetPort++,
  username: TemperatureSensor.accessory.username,
  pincode: TemperatureSensor.accessory.pincode,
});

XiaomiTemperatureSensor.accessory.publish({
  port: targetPort++,
  username: XiaomiTemperatureSensor.accessory.username,
  pincode: XiaomiTemperatureSensor.accessory.pincode,
});

HumiditySensor.accessory.publish({
  port: targetPort++,
  username: HumiditySensor.accessory.username,
  pincode: HumiditySensor.accessory.pincode,
});

XiaomiHumiditySensor.accessory.publish({
  port: targetPort++,
  username: XiaomiHumiditySensor.accessory.username,
  pincode: XiaomiHumiditySensor.accessory.pincode,
});

let XiaomiAirPurrifierPro = null;

(async () => {
  XiaomiAirPurrifierPro = await miio.device({
    address: process.env.XIAOMI_AIR_PURRIFIER_IP,
    token: process.env.XIAOMI_AIR_PURRIFIER_TOKEN,
  });

  const pm25 = await XiaomiAirPurrifierPro.pm2_5();
  XiaomiTemperatureSensor.updateTemperature(pm25);

  XiaomiAirPurrifierPro.on('pm2.5Changed', (updatedPm25) => {
    XiaomiAirQualitySensor.updatePM25(updatedPm25);
  });

  const { value: temperature } = await XiaomiAirPurrifierPro.temperature();
  XiaomiTemperatureSensor.updateTemperature(temperature);

  XiaomiAirPurrifierPro.on('temperatureChanged', ({ value: updatedTemperature }) => {
    XiaomiTemperatureSensor.updateTemperature(updatedTemperature);
  });

  const humidity = await XiaomiAirPurrifierPro.relativeHumidity();
  XiaomiHumiditySensor.updateHumidity(humidity);

  XiaomiAirPurrifierPro.on('relativeHumidityChanged', (updatedHumidity) => {
    XiaomiHumiditySensor.updateHumidity(updatedHumidity);
  });
})();

// destroy sensors
const signals = { 'SIGINT': 2, 'SIGTERM': 15 };
Object.keys(signals).forEach(signal => {
  process.on(signal, () => {
    XiaomiAirQualitySensor.accessory.unpublish();
    AirQualitySensor.accessory.unpublish();
    TemperatureSensor.accessory.unpublish();
    XiaomiTemperatureSensor.accessory.unpublish();
    HumiditySensor.accessory.unpublish();
    XiaomiHumiditySensor.accessory.unpublish();

    XiaomiAirPurrifierPro.destroy();

    setTimeout(() => {
      process.exit(128 + signals[signal]);
    }, 1000);
  });
});
