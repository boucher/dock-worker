var HTTP = require("http");
var URL =  require('url');
var DockWorker = require("../index.js");

var defaults = require("../defaults.js");
defaults.HostConfig.PublishAllPorts = true;
defaults.Image = "nginx:latest";

var dockWorker = new DockWorker({ defaultConfig: defaults });

function handleIncomingRequest(request, response)
{
    var parsed = URL.parse(request.url, true);
    var message = parsed.query.message || "Add \"?message=HI\" to the worker creation request to customize!";

    dockWorker.getWorker(function initializeWorker(worker) {
        return worker.container.execAsync({ AttachStdout: true, Cmd: ["/bin/sh", "-c", "echo '" + message + "' > /usr/share/nginx/html/index.html"] })
        .then(function(exec) {
            return exec.startAsync();
        })
        .then(function(stream) {
            stream.setEncoding('utf8');
            stream.pipe(process.stdout);
            return new Promise(function(resolve, reject) {
                stream.on("end", resolve)
            })
        })
        .then(function() {
            var port = worker.details.NetworkSettings.Ports["80/tcp"][0].HostPort;
            response.setHeader("Location", "http://localhost:" + port);
            response.statusCode = 302;
            response.end();
        })
    })
    .catch(function(anError){
        response.end(anError.toString())
    })
}

var server = HTTP.createServer(handleIncomingRequest)
server.listen(process.env.PORT || 8008);
