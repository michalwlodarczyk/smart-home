const express = require('express');
const ThingSpeakClient = require('thingspeakclient');
const storage = require('node-persist');
const TemperatureSensor = require('./accessories/TemperatureSensor_accessory');
const AirQualitySensor = require('./accessories/AirQualitySensor_accessory');
const HumiditySensor = require('./accessories/HumiditySensor_accessory');

const app = express();
const port = 3000;
const thingSpeak = new ThingSpeakClient();
const channelId = 0;
const writeKey = 'XXXXXXXXXXXXXXXX';

const paramsMap = {
  pm25: 'field1',
  pm10: 'field2',
  humidity: 'field3',
  temperature: 'field4',
};

thingSpeak.attachChannel(channelId, { writeKey });

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/sds', function (req, res) {
  const { pm25, pm10 } = req.query;

  AirQualitySensor.updatePM25(pm25);
  AirQualitySensor.updatePM10(pm10);

  thingSpeak.updateChannel(
    channelId,
    {
      [paramsMap['pm25']]: pm25,
      [paramsMap['pm10']]: pm10,
    },
    (err, resp) => {
      if (!err && resp > 0) {
        console.log('pm update successfully. Entry number was: ' + resp);
        res.send('done');
      } else res.send('err')
    });
});

app.get('/dht', function (req, res) {
  const { temperature, humidity } = req.query;

  TemperatureSensor.updateTemperature(temperature);
  HumiditySensor.updateHumidity(humidity);

  thingSpeak.updateChannel(
    channelId,
    {
      [paramsMap['humidity']]: humidity,
      [paramsMap['temperature']]: temperature,
    },
    (err, resp) => {
      if (!err && resp > 0) {
        console.log('h&t update successfully. Entry number was: ' + resp);
        res.send('done');
      } else res.send('err')
    });
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

TemperatureSensor.accessory.publish({
  port: targetPort++,
  username: TemperatureSensor.accessory.username,
  pincode: TemperatureSensor.accessory.pincode,
});

HumiditySensor.accessory.publish({
  port: targetPort++,
  username: HumiditySensor.accessory.username,
  pincode: HumiditySensor.accessory.pincode,
});

// destroy sensors
const signals = { 'SIGINT': 2, 'SIGTERM': 15 };
Object.keys(signals).forEach(signal => {
  process.on(signal, () => {
    AirQualitySensor.accessory.unpublish();
    TemperatureSensor.accessory.unpublish();
    HumiditySensor.accessory.unpublish();

    setTimeout(() => {
      process.exit(128 + signals[signal]);
    }, 1000);
  });
});
