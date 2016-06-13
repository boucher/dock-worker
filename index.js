var Dockerode = require('dockerode-bluebird');
var EventEmitter = require("events").EventEmitter;

const WorkerState = Object.freeze({
    Created: "Created",           // the container has been created but is not yet running
    Initializing: "Initializing", // the container is running, but has not yet received its "worker config"
    Running: "Running",           // the container is now ready to process events
    Terminated: "Terminated"      // the container has been killed
})

function DockWorker(options) {
    this.defaultConfig = options.config || require("./defaults");
    this.defaultConfig.Image = options.image || this.defaultConfig.Image;
    this.configureWorker = options.configureWorker;
    this.poolSize = options.poolSize || 3;
    this.docker = new Dockerode({ socketPath: options.socketPath || '/var/run/docker.sock' });
    this.eventEmitter = new EventEmitter();
    this.pool = [];
    this.initializePool();
}

DockWorker.prototype.initializePool = function() {
    for (var n = 0; n < this.poolSize; n++) {
        this.pool.push(this.createWorker(this.defaultConfig));
    }
}

DockWorker.prototype.getWorker = function(initializeFunction) {
    this.pool.push(this.createWorker(this.defaultConfig));
    return this.initializeWorker(this.pool.shift(), initializeFunction || this.configureWorker);
}

DockWorker.prototype.createWorker = function(options, startOptions) {
    var self = this, worker = { created: new Date() };

    return this.docker.createContainerAsync(options)
    .then(function(container) {
        worker.container = container;
        worker.state = WorkerState.Created
        self.eventEmitter.emit("created", worker);

        return worker.container.startAsync(startOptions || {});
    })
    .then(function() {
        return worker.container.inspectAsync();
    })
    .then(function(details) {
        worker.details = details;

        worker.container.waitAsync().then(function(exitCode) {
            if (worker.state !== WorkerState.Terminated) {
                var poolIndex = self.pool.indexOf(worker);
                if (poolIndex !== -1) { self.pool.splice(poolIndex, 1); }

                worker.state = WorkerState.Terminated;
                self.eventEmitter.emit("terminated", worker);
            }
            worker.container.removeAsync({ force: true })
        })

        return worker;
    })
}

DockWorker.prototype.initializeWorker = function(workerPromise, initializeFunction) {
    var self = this;
    return Promise.resolve(workerPromise)
    .then(function(worker)
    {
        worker.state = WorkerState.Initializing
        self.eventEmitter.emit("initializing", worker);

        return initializeFunction ? initializeFunction(worker) : null;
    })
    .then(function()
    {
        worker.state = WorkerState.Running;
        self.eventEmitter.emit("running", worker);

        return worker;
    })
}

module.exports = DockWorker;

module.exports.WorkerState = WorkerState;
