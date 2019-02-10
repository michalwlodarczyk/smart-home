const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;

let currentPM25 = 0;

const airQuality = () => {
  if (currentPM25 === 0) {
    return Characteristic.AirQuality.UNKNOWN;
  }

  if (currentPM25 > 0 && currentPM25 <= 10) {
    return Characteristic.AirQuality.EXCELLENT;
  }

  if (currentPM25 > 10 && currentPM25 <= 20) {
    return Characteristic.AirQuality.GOOD;
  }

  if (currentPM25 > 20 && currentPM25 <= 30) {
    return Characteristic.AirQuality.FAIR;
  }

  if (currentPM25 > 30 && currentPM25 <= 40) {
    return Characteristic.AirQuality.INFERIOR;
  }

  if (currentPM25 > 40) {
    return Characteristic.AirQuality.POOR;
  }
};

const sensorUUID = uuid.generate('hap-nodejs:accessories:xiaomi-air-quality-sensor');
const sensor = new Accessory('Xiaomi Air Quality Sensor', sensorUUID);

sensor.username = "C1:5D:3A:AE:5E:FF";
sensor.pincode = "031-45-154";

sensor.addService(Service.AirQualitySensor);

sensor
  .getService(Service.AirQualitySensor)
  .getCharacteristic(Characteristic.AirQuality)
  .on('get', function(callback) {
    callback(null, airQuality());
  });

sensor
  .getService(Service.AirQualitySensor)
  .addCharacteristic(Characteristic.PM2_5Density)
  .on('get', (callback) => {
    callback(null, currentPM25);
  });

module.exports.updatePM25 = pm25 => {
  currentPM25 = pm25;

  sensor
    .getService(Service.AirQualitySensor)
    .setCharacteristic(Characteristic.PM2_5Density, currentPM25);

  sensor
    .getService(Service.AirQualitySensor)
    .setCharacteristic(Characteristic.AirQuality, airQuality());
};

module.exports.accessory = sensor;
