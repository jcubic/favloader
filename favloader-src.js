/**@license
 *
 * favloader v. {{VER}}
 *
 * Vanilla JavaScript library for loading animation in favicon
 *
 * Copyright (c) 2018-2019 Jakub T. Jankiewicz <https://jcubic.pl/me>
 * Released under the MIT license
 *
 * Build: {{DATE}}
 */
/* global define, module, global, Worker, Blob, BlobBuilder, setTimeout, parseGIF */
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
            window.BlobBuilder = window.BlobBuilder ||
                window.WebKitBlobBuilder ||
                window.MozBlobBuilder;
            blob = new BlobBuilder();
            blob.append(str);
            blob = blob.getBlob();
        }
        return new Worker(URL.createObjectURL(blob));
    }
    // ----------------------------------------------------------------------------------
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
                    raf[interval_id] = self.setInterval(function() {
                        self.postMessage({ type: 'interval', id: interval_id });
                    }, data.params[1]);
                    self.postMessage({ type: 'RPC', id: id, result: interval_id });
                } else if (data.method == 'clearInterval') {
                    self.clearInterval(raf[data.params[0]]);
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
            set: function(fn, interval) {
                var interval_id = Date.now();
                callbacks[interval_id] = fn;
                rpc('setInterval', [interval_id, interval]);
                return interval_id;
            },
            clear: function(id) {
                delete callbacks[id];
                return rpc('clearInterval', [id]);
            }
        };
    })();
    // ----------------------------------------------------------------------------------

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
    // ----------------------------------------------------------------------------------
    function warn(message) {
      if (console && console.warn) {
          console.warn(message);
      } else {
        setTimeout(function() {
          throw new Error(message);
        }, 0);
      }
    }
    // ----------------------------------------------------------------------------------
    var ctx,
        c,
        link,
        icon,
        id,
        progress = 0,
        duration,
        initialized,
        settings,
        gif,
        type,
        initial_turns = -.25,
        interval_id,
        step;
    // ----------------------------------------------------------------------------------
    function init(options) {
        if (document.readyState !== "complete") {
            setTimeout(init.bind(this, options), 100);
            return;
        }
        settings = Object.assign({
            size: 16,
            radius: 6,
            thickness: 2,
            color: '#0F60A8',
            duration: 5000
        }, options);

        if (!link) {
            link = document.querySelector('link[rel*="icon"]');
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'icon');
                document.head.appendChild(link);
                warn("No default icon found, restore state will not work");
            } else {
                icon = link.getAttribute('href');
                type = link.getAttribute('type');
            }
        }

        clear();

        if (settings.gif) {
            if (typeof parseGIF === 'undefined') {
                throw new Error('parseGIF not defined, please include parseGIF.js file');
            }
            parseGIF(settings.gif).then(function(data) {
                gif = data;
            });
        } else {
            if (!c) {
                c = document.createElement('canvas');
            }
            c.width = c.height = settings.size;
            ctx = c.getContext('2d');

            ctx.lineCap = "round";
            ctx.lineWidth = settings.thickness;
            ctx.strokeStyle = settings.color;
            duration = settings.duration;
        }
        initialized = true;
    }
    // ----------------------------------------------------------------------------------
    function clear() {
        if (interval_id) {
            interval.clear(interval_id);
            interval_id = null;
        }
    }
    // ----------------------------------------------------------------------------------
    function restore() {
        if (icon) {
            link.setAttribute('href', icon + '?' + Date.now());
            link.setAttribute('type', type);
        } else if (link) {
            link.parentNode.removeChild(link);
        }
        clear();
    }
    // ----------------------------------------------------------------------------------
    function animate() {
        if (!initialized) {
            setTimeout(animate, 100);
            return;
        }
        if (interval_id) {
            return;
        }
        progress = 0;
        if (settings.gif && parseGIF) {
            if (!gif) {
                setTimeout(animate, 100);
                return;
            }
            interval_id = interval.set(animateGIF, 20);
        } else {
            interval_id = interval.set(draw, 20);
        }
    }
    // ----------------------------------------------------------------------------------
    function turn(x) {
        return (x + initial_turns) * 2 * Math.PI;
    }
    // ----------------------------------------------------------------------------------
    function animateGIF() {
        progress++;
        if (progress >= gif.uris.length) {
            progress = 0;
        }
        update(gif.uris[progress]);
    }
    // ----------------------------------------------------------------------------------
    function arcStart(pos) {
        return turn(pos + initial_turns) + turn(Math.max(0, pos * 2 - 1));
    }
    // ----------------------------------------------------------------------------------
    function arcEnd(pos) {
        return turn(pos + initial_turns) + turn(Math.min(1, pos * 2));
    }
    // ----------------------------------------------------------------------------------
    function update(dataURI) {
        var newIcon, icon = document.querySelector('link[rel*="icon"]');
        (newIcon = icon.cloneNode(true)).setAttribute('href', dataURI);
        icon.parentNode.replaceChild(newIcon, icon);
        link = newIcon;
    }
    // ----------------------------------------------------------------------------------
    function draw() {
        ctx.clearRect(0, 0, settings.size, settings.size);
        if (typeof settings.frame === 'function') {
            settings.frame(ctx);
        } else {
            var position = progress % duration / duration;
            ctx.beginPath();
            var center = Math.round(settings.size / 2);
            ctx.arc(center, center, settings.radius, arcStart(position), arcEnd(position));
            ctx.stroke();
        }
        update(ctx.canvas.toDataURL());
        progress += duration / 100;
    }
    // ----------------------------------------------------------------------------------
    return {
        init: init,
        start: animate,
        stop: restore,
        version: '{{VER}}'
    };
});
