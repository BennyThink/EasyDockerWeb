const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const stream = require('stream');

const docker = new Docker();
const returnContainersRouter = (io) => {
    /* GET containers. */
    router.get('/', (req, res, next) => {
        docker.listContainers({all: true}, (err, containers) => {
            res.locals.formatName = (str) => {
                return str[0].split('/')[1];
            };
            docker.listImages(null, (err, listImages) => {
                res.render('containers',
                    {
                        containers: containers,
                        images: listImages,
                    });
            });
        });
    });

    router.get('/start/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);
        container.start(null, (err, data) => {
            res.redirect('/containers');
        });
    });

    router.get('/stop/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);
        container.stop(null, (err, data) => {
            res.redirect('/containers');
        });
    });

    router.get('/remove/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);
        container.remove({force: true}, (err, data) => {
            if (err) {
                res.render('error', {error: err, message: err.json.message});
            } else {
                res.redirect('/containers');
            }
        });
    });

    router.post('/create', (req, res, next) => {
        let options = {
            Image: req.body.containerImage,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            HostConfig: {
                PortBindings: {},
            },
        };

        // name
        if (req.body.containerName !== '') {
            options = {
                ...options,
                name: req.body.containerName,
            };
        }

        // volume
        if (req.body.containerVolumeSource !== '' &&
            req.body.containerVolumeDistination !== '') {
            const src = req.body.containerVolumeSource;
            const dis = req.body.containerVolumeDistination;
            options['Volumes'] = JSON.parse('{"' + dis + '": {}}');
            options.HostConfig = {
                'Binds': [src + ':' + dis],
                'RestartPolicy': {
                    'Name': req.body.isAlways === 'on' ? 'always' : '',
                    'MaximumRetryCount': 5,
                },
            };
        }

        // restart policy
        options.HostConfig = {
            'RestartPolicy': {
                'Name': req.body.isAlways === 'on' ? 'on-failure' : '',
                'MaximumRetryCount': 5,
            }
        };

        // default ssh
        options.HostConfig.PortBindings = {'22/tcp': [{HostPort: ''}]}
        options.ExposedPorts = {'22/tcp': {}};
        options.HostConfig.PortBindings['22/udp'] = [{HostPort: ""}]
        options.ExposedPorts['22/udp'] = {};

        let srcPortString = req.body.containerPortSource
        if (srcPortString.indexOf("-") !== -1) {
            let startEnd = srcPortString.split("-")
            let start = startEnd[0]
            let end = startEnd[1]
            let portRange = Array(end - start + 1).fill().map((element, index) => index + parseInt(start))
            portRange.forEach(function (port) {
                options.HostConfig.PortBindings[port + '/tcp'] = [{HostPort: ""}]
                options.ExposedPorts[port + '/tcp'] = {};
                options.HostConfig.PortBindings[port + '/udp'] = [{HostPort: ""}]
                options.ExposedPorts[port + '/udp'] = {};
            })
        } else if (req.body.containerPortSource !== '' &&
            req.body.containerPortDistination !== '') {
            const src = req.body.containerPortSource;
            const dis = req.body.containerPortDistination;

            options.HostConfig.PortBindings[src + '/tcp'] = [{HostPort: dis}]
            options.ExposedPorts[src + '/tcp'] = {};
            options.HostConfig.PortBindings[src + '/udp'] = [{HostPort: dis}]
            options.ExposedPorts[src + '/udp'] = {};
        }
        // setting ram limit
        //  So if --memory="300m" and --memory-swap="1g", the container can use 300m of memory and 700m (1g - 300m) swap.
        if (req.body.containerMem!== '') {
            options.HostConfig.Memory = req.body.containerMem * 1024 * 1024;
        }
        // limit cpu
        if (req.body.containerCPU !== '') {
            // 1 core=1000000000 10**9
            options.HostConfig.NanoCpus = parseFloat(req.body.containerCPU) * 10 ** 9;
        }
        console.log(req.body);
        console.log(JSON.stringify(options, null, 4));
        // options.HostConfig.PortBindings={ '22/tcp': [ { HostPort: '' } ],'22/udp': [ { HostPort: '' } ] }
        // options.ExposedPorts = { '22/tcp': {} , '22/udp': {} };

        if (req.body.containerCmd !== '') {
            options.Cmd = ['/bin/sh', '-c', req.body.containerCmd];
            // console.log(options)
            docker.createContainer(options, (err, container) => {
                if (err) throw err;
                container.start((err, data) => {
                    res.redirect('/containers/logs/' + container.id);
                });
            });
        } else {
            const runOpt = {
                Image: req.body.containerImage,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                Tty: true,
                //Cmd: ['/bin/sh'],
                OpenStdin: false,
                StdinOnce: false,
                ...options,
            };
            docker.createContainer(runOpt).then(function (container) {
                return container.start();
            }).then((container) => {
                res.redirect('/containers');
            });
        }

    });

    router.get('/console/:id', (req, res, next) => {
        res.render('terminal');
    });

    router.get('/logs/:id', (req, res, next) => {
        res.render('logs');
    });
    router.get('/inspect/:id', (req, res, next) => {
        const container = docker.getContainer(req.params.id);

        container.inspect(function (err, data) {
            res.json(data);
            // res.json({"data":"v"});
        });
    });

    io.on('connection', (socket) => {
        socket.on('exec', (id, w, h) => {
            const container = docker.getContainer(id);
            let cmd = {
                'AttachStdout': true,
                'AttachStderr': true,
                'AttachStdin': true,
                'Tty': true,
                Cmd: ['/bin/sh'],
            };
            container.exec(cmd, (err, exec) => {
                let options = {
                    'Tty': true,
                    stream: true,
                    stdin: true,
                    stdout: true,
                    stderr: true,
                    // fix vim
                    hijack: true,
                };

                container.wait((err, data) => {
                    socket.emit('end', 'ended');
                });

                if (err) {
                    return;
                }

                exec.start(options, (err, stream) => {
                    const dimensions = {h, w};
                    if (dimensions.h != 0 && dimensions.w != 0) {
                        exec.resize(dimensions, () => {
                        });
                    }

                    stream.on('data', (chunk) => {
                        socket.emit('show', chunk.toString());
                    });

                    socket.on('cmd', (data) => {
                        stream.write(data);
                    });

                });
            });
        });

        socket.on('attach', (id, w, h) => {
            const container = docker.getContainer(id);

            const logStream = new stream.PassThrough();
            logStream.on('data', (chunk) => {
                socket.emit('show', chunk.toString('utf8'));
            });

            const logs_opts = {
                follow: true,
                stdout: true,
                stderr: true,
                timestamps: false,
            };

            const handler = (err, stream) => {
                container.modem.demuxStream(stream, logStream, logStream);
                if (!err && stream) {
                    stream.on('end', () => {
                        logStream.end('===Logs stream finished===');
                        socket.emit('end', 'ended');
                        stream.destroy();
                    });
                }
            };

            container.logs(logs_opts, handler);
        });

        socket.on('getSysInfo', (id) => {
            const container = docker.getContainer(id);
            container.stats((err, stream) => {
                if (!err && stream != null) {
                    stream.on('data', (data) => {
                        socket.emit(id, data.toString('utf8'));
                    });
                    stream.on('end', () => {
                        socket.emit('end', 'ended');
                        stream.destroy();
                    });
                }
            });
        });

        socket.on('end', () => {
            array = [];
            streams.map((stream) => {
                stream.destroy();
            });
            console.log('--------end---------');
        });

        let array = [];
        let streams = [];
        // for react web ui
        socket.on('getContainersInfo', (id) => {
            if (array.indexOf(id) === -1) {
                array.push(id);
                console.log('socket.io => getContainersInfo ' + id);
                const container = docker.getContainer(id);
                container.stats((err, stream) => {
                    streams.push(stream);
                    if (!err && stream != null) {
                        stream.on('data', (data) => {
                            const toSend = JSON.parse(data.toString('utf8'));
                            socket.emit('containerInfo', toSend);
                        });
                        stream.on('end', () => {
                            socket.emit('end', 'ended');
                            stream.destroy();
                        });
                    }
                });
            }
        });

    });

    return router;
};

module.exports = returnContainersRouter;
