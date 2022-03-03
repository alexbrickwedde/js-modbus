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
            await readModbusData(1)
            await readModbusData(2)
            await readModbusData(3)
	setTimeout(() => {process.exit(0)}, 1000)
        })
        .catch(function(e)
        {
process.exit(1)
        });
}

var readModbusData = async function(id)
{
client.setID(id)
const response = await client.poll({
    unit: id,
    map: [
        { fc: 4, address: [0,6,70], type: "float" },
    ],
    onProgress: (progress, data) => {
    },
    maxChunkSize: 32,  // max registers per request
    skipErrors: false, // if false it will stop poll and return PARTIAL result
})
if(response.error) {
  await mqttclient.publish('modbus/'+id+'/error', JSON.stringify(response))
} else {
 for(var o of response.data) {
  await mqttclient.publish('modbus/'+id+'/'+o.address, JSON.stringify(o.value))
 }
}
return response
};


mqttclient.on('connect', () => {
  mqttclient.publish('modbus/conn',""+new Date().getTime())
  doModbus();
})

