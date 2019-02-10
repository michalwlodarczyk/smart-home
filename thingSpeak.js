const ThingSpeakClient = require('thingspeakclient');

const thingSpeak = new ThingSpeakClient();
const channelId = parseInt(process.env.THING_SPEAK_CHANNEL_ID);
const writeKey = process.env.THING_SPEAK_WRITE_KEY;
const paramsMap = {
  pm25: 'field1',
  pm10: 'field2',
  humidity: 'field3',
  temperature: 'field4',
};

thingSpeak.attachChannel(channelId, { writeKey });

module.exports.updatePM = (pm25, pm10, cb) => {
  thingSpeak.updateChannel(
    channelId,
    {
      [paramsMap['pm25']]: pm25,
      [paramsMap['pm10']]: pm10,
    },
    (err, resp) => {
      if (!err && resp > 0) {
        console.log('pm update successfully. Entry number was: ' + resp);
      } else {
        console.log('error - pm not updated');
      }

      cb();
    });
};

module.exports.updateTemperatureAndHumidity = (temperature, humidity, cb) => {
  thingSpeak.updateChannel(
    channelId,
    {
      [paramsMap['humidity']]: humidity,
      [paramsMap['temperature']]: temperature,
    },
    (err, resp) => {
      if (!err && resp > 0) {
        console.log('h&t update successfully. Entry number was: ' + resp);
      } else {
        console.log('error - h&t not updated');
      }

      cb();
    });
};
