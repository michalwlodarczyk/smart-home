const express = require('express');
const storage = require('node-persist');
const uuid = require('hap-nodejs').uuid;
const Bridge = require('hap-nodejs').Bridge;
const Accessory = require('hap-nodejs').Accessory;
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

app.get('/', (req, res) => res.send('HAP-NodeJS works!'));

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

app.listen(port, () => console.log(`HAP-NodeJS listening on port ${port}!`));

// Initialize our storage system
storage.initSync();

const bridge = new Bridge('Node Bridge', uuid.generate("Node Bridge"));

bridge.on('identify', (paired, callback) => {
  callback();
});

bridge.addBridgedAccessory(AirQualitySensor.accessory);
bridge.addBridgedAccessory(XiaomiAirQualitySensor.accessory);
bridge.addBridgedAccessory(TemperatureSensor.accessory);
bridge.addBridgedAccessory(XiaomiTemperatureSensor.accessory);
bridge.addBridgedAccessory(HumiditySensor.accessory);
bridge.addBridgedAccessory(XiaomiHumiditySensor.accessory);

bridge.publish({
  username: "CC:22:3D:E3:CE:F6",
  port: 51826,
  pincode: "031-45-154",
  category: Accessory.Categories.BRIDGE
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
    bridge.unpublish();
    XiaomiAirPurrifierPro.destroy();

    setTimeout(() => {
      process.exit(128 + signals[signal]);
    }, 1000);
  });
});
