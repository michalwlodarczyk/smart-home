const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;

let currentTemperature = 0;

const sensorUUID = uuid.generate('hap-nodejs:accessories:temperature-sensor');
const sensor = new Accessory('Temperature Sensor', sensorUUID);

sensor.username = "C1:5D:3A:AE:5E:FA";
sensor.pincode = "031-45-154";

sensor.addService(Service.TemperatureSensor);

sensor
  .getService(Service.TemperatureSensor)
  .getCharacteristic(Characteristic.CurrentTemperature)
  .on('get', callback => {
    callback(null, currentTemperature);
  });

module.exports.updateTemperature = temperature => {
  currentTemperature = temperature;

  sensor
    .getService(Service.TemperatureSensor)
    .setCharacteristic(Characteristic.CurrentTemperature, temperature);
};

module.exports.accessory = sensor;
