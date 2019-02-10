const Accessory = require('hap-nodejs').Accessory;
const Service = require('hap-nodejs').Service;
const Characteristic = require('hap-nodejs').Characteristic;
const uuid = require('hap-nodejs').uuid;

let currentHumidity = 0;

const sensorUUID = uuid.generate('hap-nodejs:accessories:xiaomi-humidity-sensor');
const sensor = new Accessory('Xiaomi Humidity Sensor', sensorUUID);

sensor.username = "C1:5D:3A:AE:5E:FE";
sensor.pincode = "031-45-154";

sensor.addService(Service.HumiditySensor);

sensor
  .getService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', callback => {
    callback(null, currentHumidity);
  });

module.exports.updateHumidity = humidity => {
  currentHumidity = humidity;

  sensor
    .getService(Service.HumiditySensor)
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, humidity);
};

module.exports.accessory = sensor;
