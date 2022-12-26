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

function displayData(err, obisResult) {
    if (err) {
        // handle error
        // if you want to cancel the processing because of this error call smTransport.stop() before returning
        // else processing continues
        return;
    }
    for (var obisId in obisResult) {
        console.log(
            obisResult[obisId].idToString() + ': ' +
            SmartmeterObis.ObisNames.resolveObisName(obisResult[obisId], options.obisNameLanguage).obisName + ' = ' +
            obisResult[obisId].valueToString()
        );
    }

}

var smTransport = SmartmeterObis.init(options, displayData);

smTransport.process();

setTimeout(smTransport.stop, 60000);

