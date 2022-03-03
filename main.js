/* eslint-disable no-console, spaced-comment, func-call-spacing, no-spaced-func */

"use strict";

var ModbusRTU   = require ("modbus-serial");
var client      = new ModbusRTU();

client.on("error", function(error) {
    console.error("SerialPort Error: ", error);
});

    client.setTimeout (250);

    client.connectRTUBuffered ("/dev/ttyUSB0", { baudRate: 2400, parity: "none", dataBits: 8, stopBits: 1 })
        .then(async function()
        {
            console.log([await readModbusData(1), await readModbusData(2), await readModbusData(3)])
        })
        .catch(function(e)
        {
        });


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
return response
};


