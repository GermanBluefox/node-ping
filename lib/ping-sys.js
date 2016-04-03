/**
* LICENSE MIT
* (C) Daniel Zelisko
* http://github.com/danielzzz/node-ping
*
* a simple wrapper for ping
* Now with support of all Windows.
*
*/

//system library
var sys = require('util'),
    cp = require('child_process'),
    os = require('os');

/**
 * Class::Ping construtor
 *
 * @param addr string
 * @param cb function (data, err)
 *      arguments order is based on compatabile issue
 */
function probe(addr, cb) {
        var p = os.platform().toLowerCase();
        var ls = null;
        var outstring = "";
        var xfamily = ['linux', 'sunos', 'unix'];
        var regex = /=.*[<|=]([0-9]*).*TTL|ttl..*=([0-9\.]*)/;

        if (xfamily.indexOf(p) !== -1) {
            //linux
            ls = cp.spawn('/bin/ping', ['-n', '-w 2', '-c 1', addr]);
        } else if (p.match(/^win/)) {
            //windows
            ls = cp.spawn(process.env.SystemRoot + '/system32/ping.exe', ['-n', '1', '-w', '5000', addr]);
        } else if (p === 'darwin' || p === 'freebsd') {
            //mac osx or freebsd
            ls = cp.spawn('/sbin/ping', ['-n', '-t 2', '-c 1', addr]);
        } else {
            console.error('Your platform "' + p + '" is not supported');
            if (cb) {
                cb(false, 'Your platform "' + p + '" is not supported');
            }
            return;
        }

        ls.on('error', function (e) {
            var err = new Error('ping.probe: there was an error while executing the ping program. check the path or permissions...');
            cb(null, err);
        });


        ls.stdout.on('data', function (data) {
            outstring += String(data);
        });

        ls.stderr.on('data', function (data) {
          //sys.print('stderr: ' + data);
        });

        ls.on('exit', function (code) {
            var result;
            // workaround for windows machines
            // if host is unreachable ping will return
            // a successfull error code
            // so we need to handle this ourself
            if (p.match(/^win/)) {
                var lines = outstring.split('\n');
                result = false;
                for (var t = 0; t < lines.length; t++) {
                    var m = regex.exec(lines[t]) || "";
                    if (m !== '') {
                        result	= true;
                        break;
                    }
                }
            } else {
                result = !code;
            }

            if (cb) {
                cb(result, null);
            }
        });
}

exports.probe = probe;
