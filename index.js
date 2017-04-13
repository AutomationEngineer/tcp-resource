//var serialPortLib = require('serialport');
//var SerialPort = serialPortLib.SerialPort;
var SerialPort = require('serialport');

function SerialResource(portName, parameters, silent, callbackOpen) {

    if (typeof parameters === 'object'){
        parameters.autoOpen = false;
    } else {
        parameters = {autoOpen: false};
    }

    var port = new SerialPort(portName, parameters);
    this.port = port;

    var usersQueue = [];
    this.usersQueue = usersQueue;
    this.usersQueue.currentUserNo = 0;

    port.open(function(error){
        if(error){
            console.log('Failed to open ' + port.path);
        } else {
            console.log('Port '+port.path+' is opened.');

            port.on('data', function(data) {
                if(usersQueue.currentUserNo < usersQueue.length){
                    var user = usersQueue[usersQueue.currentUserNo];
                    if(typeof user.onData === "function")user.onData(data);
                }
            });
            port.on('error', function(error) {
                if(usersQueue.currentUserNo < usersQueue.length){
                    var user = usersQueue[usersQueue.currentUserNo];
                    if(typeof user.onError === "function")user.onError(error);
                }
            });
        }

        if(typeof callbackOpen === "function")callbackOpen(error);
    });
}

SerialResource.prototype.addUser = function(user) {
    this.usersQueue.push(user);
    return this;
};

SerialResource.prototype.startQueue = function() {
    if(this.usersQueue.length > 0){
        var user = this.usersQueue[this.usersQueue.currentUserNo];
        if(typeof user.go === "function")setTimeout(function(){user.go();},0);
    }
};

SerialResource.prototype.userFinished = function() {
    if(this.usersQueue.length > 0){
        this.usersQueue.currentUserNo++;
        if(this.usersQueue.currentUserNo >= this.usersQueue.length)this.usersQueue.currentUserNo = 0;
        var user = this.usersQueue[this.usersQueue.currentUserNo];
        if(typeof user.go === "function")setTimeout(function(){
            user.go();
        },0);
    }
};

SerialResource.prototype.write = function(data, handler) {
    this.port.write(data, handler);
};

module.exports = SerialResource;