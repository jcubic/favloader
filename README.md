# favloader

[![npm](https://img.shields.io/badge/npm-0.3.0-blue.svg)](https://www.npmjs.com/package/favloader)
[![MIT badge](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jcubic/favloader/blob/master/LICENSE)

Vanilla JavaScript library for loading animation in favicon that work when tab is not active

## Why this library

Basic solution with animation using canvas don't work out of the box because of limitation of timer functions in Browsers' main
Thread. The library use web worker to create timer that don't stop when tab is not in focus.

You can use this library if you have time consuming calculation and people switch tabs and you wan them to be notified when
application finish whatever it was doing.

## Installation

You can using webpack to include the files (using `require`) use local file in script tag:

```html
<script src="favloader.js"></script>
```

you can also get the file from unpkg.com:

```html
<script src="https://unpkg.com/favloader@0.x.x"></script>
```

## API

Initialization

```javascript
favloader.init({
    size: 16,
    radius: 6,
    thickness: 2,
    color: '#0F60A8',
    duration: 5000
});
```

All options are optional (those are the defaults).

## Gif support

from version 0.3.0 the library support animating GIF in browsers that don't support gif files in link tag.
The feature use AJAX and canvas. So gif file need to be on same domain or on domain that enabled CORS.

To create favicon loader using GIF file, you need to include `parseGIF.js` file:

```html
<script src="https://unpkg.com/favloader@0.x.x/parseGIF.js"></script>
```

then init the library with GIF options, that point to GIF file (the GIF file is not scaled to match favicon,
and was not tested on big GIF files).

```javascript
favloader.init({
    gif: 'loader.gif'
});
```

## Animation


Start animating

```javascript
favloader.start();
```

```javascript
favloader.stop();
```

Looks best if you don't have lot of tabs or if you do when tab is not in focus.

## Limitation

To restore the icon properly, after stop, you need to include default favicon:

```html
<link rel="icon" type="image/x-icon" href="favicon.ico"/>
```

## License

Copyright (c) 2018 Jakub T. Jankiewicz <https://jcubic.pl/me>

Released under the MIT license
