var Net = require('net');

function tcpResource(host, port, callbackOpen) {
    var context = this;

    context.usersQueue = [];
    context.usersQueue.currentUserNo = 0;

    function connect(){
        console.log('TCP Resource connecting to: ' + host + ':' + port );
        context.socket = Net.createConnection({port: port, host:host}, () => {
                console.log('TCP Resource connected to: ' + host + ':' + port );
        if(typeof callbackOpen === "function"){
            callbackOpen();
            callbackOpen = false; // to callback at first time only;
        }
        if(context.pendingGo){
            //context.pendingGo = false;
            go(context);
        }
    });

    context.socket.on('data', function(data) {
        if(context.usersQueue.currentUserNo < context.usersQueue.length){
            var user = context.usersQueue[context.usersQueue.currentUserNo];
            if(typeof user.onData === "function")user.onData(data);
        }
        //console.log('TCP Resource data:' + JSON.stringify(data));
    }).on('close', function() {
        console.log('TCP Resource connection closed: ' + host + ':' + port );
        if(context.pendingGo){ // to inform subscribers about connection problems
            //context.pendingGo = false;
            go(context);
        }
        setTimeout(connect, 1000);
    }).on('error', function(error) {
        console.log('TCP Resource error: ' + error);
        if(context.usersQueue.currentUserNo < context.usersQueue.length){
            var user = context.usersQueue[context.usersQueue.currentUserNo];
            if(typeof user.onError === "function")user.onError(error);
        }
    });

}

connect();
}


tcpResource.prototype.addUser = function(user) {
    this.usersQueue.push(user);
    return this;
};

function go(context){
    if((!context.pendingGo) && (context.socket.destroyed || context.socket.connecting)){
        context.pendingGo = true;
    } else {
        context.pendingGo = false;
        var user = context.usersQueue[context.usersQueue.currentUserNo];
        if (typeof user.go === "function")setTimeout(function () {
            user.go();
        }, 0);
    }
}

tcpResource.prototype.startQueue = function() {
    if(this.usersQueue.length > 0){
        go(this);
    }
};

tcpResource.prototype.userFinished = function() {
    if(this.usersQueue.length > 0){
        this.usersQueue.currentUserNo++;
        if(this.usersQueue.currentUserNo >= this.usersQueue.length)this.usersQueue.currentUserNo = 0;
        go(this);
    }
};

tcpResource.prototype.write = function(data, handler) {
    if(this.socket.destroyed || this.socket.connecting){
        handler('Socket is not connected');
    } else {
        this.socket.write(data, handler);
    }
};

module.exports = tcpResource;