/**@license
 *
 * favloader - Vanilla JavaScript library for loading animation in favicon
 *
 * Copyright (c) 2018 Jakub Jankiewicz <http://jcubic.pl/me>
 * Released under the MIT license
 *
 */
/* global define, module, global, Worker, Blob, BlobBuilder */
(function(factory) {
    var root = typeof window !== 'undefined' ? window : global;
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // istanbul ignore next
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory();
    } else {
        // Browser
        // istanbul ignore next
        root.favloader = factory();
    }
})(function(undefined) {
    // we use web worker to trigger interval since browser main thread is limited
    // when tab is not active
    function fworker(fn) {
        // ref: https://stackoverflow.com/a/10372280/387194
        var str = '(' + fn.toString() + ')()';
        var URL = window.URL || window.webkitURL;
        var blob;
        try {
            blob = new Blob([str], {type: 'application/javascript'});
        } catch (e) { // Backwards-compatibility
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            blob = new BlobBuilder();
            blob.append(str);
            blob = blob.getBlob();
        }
        return new Worker(URL.createObjectURL(blob));
    }

    var interval = (function() {
        var worker = fworker(function() {
            // rAF polyfil without setTimeout, ref: https://gist.github.com/paulirish/1579671
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for(var x = 0; x < vendors.length && !self.requestAnimationFrame; ++x) {
                self.requestAnimationFrame = self[vendors[x]+'RequestAnimationFrame'];
                self.cancelAnimationFrame = self[vendors[x]+'CancelAnimationFrame']
                    || self[vendors[x]+'CancelRequestAnimationFrame'];
            }
            var raf = {};
            self.addEventListener('message', function(response) {
                var data = response.data;
                var id = data.id;
                if (data.type !== 'RPC' || id === null) {
                    return;
                }
                if (data.method == 'setInterval') {
                    var interval_id = data.params[0];
                    raf[interval_id] = self.requestAnimationFrame(function frame() {
                        self.postMessage({ type: 'interval', id: interval_id });
                        if (raf[interval_id] !== undefined) {
                            raf[interval_id] = self.requestAnimationFrame(frame);
                        }
                    });
                    self.postMessage({ type: 'RPC', id: id, result: interval_id });
                } else if (data.method == 'clearInterval') {
                    delete raf[data.params[0]];
                }
            });
        });
        var callbacks = {};
        var rpc = (function() {
            var id = 0;
            return function rpc(method, params) {
                var _id = ++id;
                return new Promise(function(resolve) {
                    worker.addEventListener('message', function handler(response) {
                        var data = response.data;
                        if (data && data.type === 'RPC' && data.id === _id) {
                            resolve(data.result);
                            worker.removeEventListener('message', handler);
                        }
                    });
                    worker.postMessage({ type: 'RPC', method: method, id: _id, params: params });
                });
            };
        })();
        worker.addEventListener('message', function(response) {
            var data = response.data;
            if (data && data.type === 'interval' && callbacks[data.id]) {
                callbacks[data.id]();
            }
        });
        return {
            set: function(fn) {
                var interval_id = Date.now();
                callbacks[interval_id] = fn;
                rpc('setInterval', [interval_id]);
                return interval_id;
            },
            clear: function(id) {
                delete callbacks[id];
                return rpc('clearInterval', [id]);
            }
        };
    })();

    var hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    var ctx, c, link, icon, id, progress = 0, duration;
    function init(options) {
        var settings = Object.assign({
            favicon_size: 16,
            line_width: 2,
            color: '#0F60A8',
            duration: 5000
        }, options);

        c = document.createElement('canvas');
        c.width = c.height = settings.favicon_size;
        c.style.position = 'absolute';
        c.style.left = '-100px';
        document.body.appendChild(c);

        ctx = c.getContext('2d');

        link = document.querySelector('link[rel*="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'icon');
            document.head.appendChild(link);
        } else {
            icon = link.getAttribute('href');
        }
        ctx.lineCap = "round";
        ctx.lineWidth = settings.line_width;
        ctx.strokeStyle = settings.color;
        duration = settings.duration;
    }
    var interval_id;
    function restore() {
        if (icon) {
            link.setAttribute('href', icon + '?' + Date.now());
        } else {
            link.parentNode.removeChild(link);
        }
        interval.clear(interval_id);
    }
    function animate() {
        progress = 0;
        interval_id = interval.set(draw);
    }
    var startTime;

    var initialTurns = -.25;
    function turn(x) {
        return (x + initialTurns) * 2 * Math.PI;
    }
    function arcStart(pos) {
        return turn(pos + initialTurns) + turn(Math.max(0, pos * 2 - 1));
    }
    function arcEnd(pos) {
        return turn(pos + initialTurns) + turn(Math.min(1, pos * 2));
    }
    var start_angle = 1.5 * Math.PI, raf, percent = 0;
    function update() {
        var newIcon, icon = document.querySelector('link[rel*="icon"]');
        (newIcon = icon.cloneNode(true)).setAttribute('href',ctx.canvas.toDataURL());
        icon.parentNode.replaceChild(newIcon, icon);
        link = newIcon;
    }
    function draw() {
        var position = progress % duration / duration;

        ctx.clearRect(0, 0, 16, 16);
        ctx.beginPath();
        ctx.arc(8, 8, 6, arcStart(position), arcEnd(position));
        ctx.stroke();
        update();
        progress += duration / 100;
    }

    return {
        init: init,
        start: animate,
        stop: restore
    };
});
