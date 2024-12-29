/* eslint-disable no-console, spaced-comment, func-call-spacing, no-spaced-func */

"use strict";

const mqtt = require('mqtt')
const mqttclient  = mqtt.connect('mqtt://ralph.nfsroot.de')

var ModbusRTU   = require ("modbus-serial");
var client      = new ModbusRTU();

client.on("error", function(error) {
    console.error("SerialPort Error: ", error);
});

client.setTimeout (250);

function doModbus() {
  client.connectRTUBuffered ("/dev/ttyUSB0", { baudRate: 2400, parity: "none", dataBits: 8, stopBits: 1 })
  .then(async function()
  {
    doPoll()
  })
  .catch(function(e)
  {
    console.error("killing",e)
    process.exit(1)
  });
}

var asyncWait = (ms) => {return new Promise((resolve, reject) => {setTimeout(() => {resolve()}, ms)})}

var doPoll = async function () {
  await readModbusData(1)
  await asyncWait(100)
  await readModbusData(2)
  await asyncWait(100)
  await readModbusData(3)
  await asyncWait(100)
  setTimeout(doPoll, 3000);
}

var readModbusData = async function(id)
{
  client.setID(id)
  const response = await client.poll({
    unit: id,
    map: [
        { fc: 4, address: [0,6,12,70], type: "float" },
    ],
    onProgress: (progress, data) => {
    },
    maxChunkSize: 32,  // max registers per request
    skipErrors: false, // if false it will stop poll and return PARTIAL result
  })
  if(response.error) {
    console.error(response.error.name)
    response.error.request.result = null
    await mqttclient.publish('modbus/'+id+'/error', JSON.stringify(response.error))
  } else {
    for(var o of response.data) {
      await mqttclient.publish('modbus/'+id+'/'+o.address, JSON.stringify(o.value))
      await mqttclient.publish('modbus/'+id+'/error', "")
    }
  }
  return response
};


mqttclient.on('connect', () => {
  mqttclient.publish('modbus/conn',""+new Date().getTime())
  doModbus();
})

var SmartmeterObis = require('smartmeter-obis');

var options = {
'debug':0,
    'protocol': "SmlProtocol",
    'transport': "SerialResponseTransport",
    'transportSerialPort': "/dev/ttyAMA0",
    'transportSerialBaudrate': 9600,
    'transportSerialDataBits': 8,
    'transportSerialParity': 'none',
    'transportSerialStopBits': 1,
    'protocolD0WakeupCharacters': 40,
    'protocolD0DeviceAddress': '',
    'requestInterval': 10,
    'obisNameLanguage': 'en',
    'obisFallbackMedium': 6
};

async function displayData(err, obisResult) {
    if (err) {
        // handle error
        // if you want to cancel the processing because of this error call smTransport.stop() before returning
        // else processing continues
        return;
    }
    await mqttclient.publish('modbus/0/power', JSON.stringify(obisResult["1-0:16.7.0*255"].valueToString()))
    await mqttclient.publish('modbus/0/power_1', JSON.stringify(obisResult["1-0:36.7.0*255"].valueToString()))
    await mqttclient.publish('modbus/0/power_2', JSON.stringify(obisResult["1-0:56.7.0*255"].valueToString()))
    await mqttclient.publish('modbus/0/power_3', JSON.stringify(obisResult["1-0:76.7.0*255"].valueToString()))
    await mqttclient.publish('modbus/0/bezug', JSON.stringify(obisResult["1-0:1.8.0*255"].valueToString()))
    await mqttclient.publish('modbus/0/lieferung', JSON.stringify(obisResult["1-0:2.8.0*255"].valueToString()))
    return;
    for (var obisId in obisResult) {
        console.log(
            obisId,
            obisResult[obisId].idToString() + ': ' +
            SmartmeterObis.ObisNames.resolveObisName(obisResult[obisId], options.obisNameLanguage).obisName + ' = ' +
            obisResult[obisId].valueToString()
        );
    }

}

var smTransport = SmartmeterObis.init(options, displayData);

smTransport.process();


