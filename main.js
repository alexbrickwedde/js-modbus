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
  console.log("poll 1")
  await readModbusData(1)
  await asyncWait(100)
  console.log("poll 2")
  await readModbusData(2)
  await asyncWait(100)
  console.log("poll 3")
  await readModbusData(3)
  await asyncWait(100)
  console.log("wait")
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

