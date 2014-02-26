var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Peripheral(controller, rssi, data, address) {
  this._controller = controller;
  this.rssi = rssi;
  this.services = {};
  this._unassignedCharacteristics = {};
  this.advertisingData = data;
  this.address = address;
  this.connection = null;
  this.flags = null;
}

util.inherits(Peripheral, EventEmitter);

Peripheral.prototype.toString = function() {
  return JSON.stringify({
    uuid: this.uuid,
    address: this.address,
    services: this.services,
    rssi: this.rssi
  });
};

Peripheral.prototype.connect = function(callback) {
  this._controller.connect(this, callback);
};

Peripheral.prototype.disconnect = function(callback) {
  this._controller.disconnect(this, callback);
};

Peripheral.prototype.discoverServices = function(services, callback) {
  this._controller.discoverServices(this, services, callback);
};

Peripheral.prototype.discoverAllServices = function(callback) {
  this._controller.discoverAllServices(this, callback);
};

/*
* When we make a new service, we should add it to our peripheral and
* find any unmatched characteristics that belong to it (if the user called
* discoverCharacteristics before finding services, for example)
*/
Peripheral.prototype.syncService = function(service, callback) {
  this.services[service.uuid] = service;

  for (var characteristicHandle in this._unassignedCharacteristics) {
    if (characteristicHandle >= service._startHandle && characteristicHandle <= service._endHandle) {
      var characteristic = this._unassignedCharacteristics[characteristicHandle];
      service.characteristics[characteristic.uuid] = characteristic;
      delete this._unassignedCharacteristics[characteristic]
    }
  }

  callback && callback();
}

Peripheral.prototype.sortServices = function(callback) {
  var sortable = [];

  for (var service in this.services) {
    sortable.push(this.services[service]);
  }

  sortable.sort(function(a, b) {return a._startHandle - b._startHandle});

  callback && callback(sortable);

  return sortable;
}

Peripheral.prototype.discoverCharacteristics = function(characteristics, callback) {
  this._controller.discoverCharacteristics(this, characteristics, callback);
};

Peripheral.prototype.discoverAllCharacteristics = function(callback) {
  this._controller.discoverAllCharacteristics(this, callback);
};

Peripheral.prototype.syncCharacteristic = function(characteristic, callback) {
  // Sort the services to speed things up a bit
  this.sortServices(function(sortedServices) {
    // Iterate through the services
    for (var i = 0; i < sortedServices.length; i++) {
      // Grab each service
      var service = sortedServices[i];
      console.log("Service: ", service);
      // If this characteristic handle falls in the range of the start and end handle
      if (characteristic.handle >= services._startHandle && characteristic.handle <= service._endHandle) {

        console.log("Found match for characteristic", characteristic.uuid, "with ", service.uuid);
        // Assign this characteristic to this service
        service[characteristic.uuid] = characteristic;
        return;
      }
    }
    // If there is no match for this characteristic, leave it unassigned
    this._unassignedCharacteristics[characteristic.handle] = characteristic;

    return;
  }.bind(this));
}


// Peripheral.prototype.discoverAllServicesAndCharacteristics = function(serviceUuids, characteristicsUuids, callback) {
  // this.discoverServices(serviceUuids, function(err, services) {
  //   var numDiscovered = 0;
  //   var allCharacteristics = [];

  //   for (var i in services) {
  //     var service = services[i];

  //     service.discoverCharacteristics(characteristicsUuids, function(error, characteristics) {
  //       numDiscovered++;

  //       if (error === null) {
  //         for (var j in characteristics) {
  //           var characteristic = characteristics[j];

  //           allCharacteristics.push(characteristic);
  //         }
  //       }

  //       if (numDiscovered === services.length) {
  //         if (callback) {
  //           callback(null, services, allCharacteristics);
  //         }
  //       }
  //     }.bind(this));
  //   }
  // }.bind(this));
// };



// Peripheral.prototype.readRemoteHandle = function(handle, callback) {
//   if (callback) {
//     this.once('handleRead' + handle, function(data) {
//       callback(null, data);
//     });
//   }

//   // TODO: Should use events...
//   this._controller.readRemoteHandle(this, this.uuid, callback);
// };

// Peripheral.prototype.writeRemoteHandle = function(handle, data, withoutResponse, callback) {
//   if (!(data instanceof Buffer)) {
//     throw new Error('data must be a Buffer');
//   }
  
//   if (callback) {
//     this.once('handleWrite' + handle, function() {
//       callback(null);
//     });
//   }

//   this._controller.writeHandle(this.uuid, handle, data, withoutResponse);
// };
// /*************************************************************
// Function:    getSignalStrength (Central Role)
// Description:   Get the signal strength (0.0-1.0) of a peripheral
// Params:    peripheral - the device to get the signal strength of.    
//        callback - A callback that should expect to receive
//        an array of available devices.
// *************************************************************/
Peripheral.prototype.updateRssi = function(callback) {
  if (callback) {
    this.once('rssiUpdate', function(rssi) {
      callback(null, rssi);
    });
  }

  this._controller.updateRssi(this);
};
module.exports = Peripheral;