# favloader

[![npm](https://img.shields.io/badge/npm-{{VER}}-blue.svg)](https://www.npmjs.com/package/favloader)
[![MIT badge](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jcubic/favloader/blob/master/LICENSE)

Vanilla JavaScript library for loading animation in favicon that work when tab is not active

See [Demo](https://jcubic.github.io/favloader/)

## Why this library

Basic solution with animation using canvas don't work out of the box because of limitation
of timer functions in Browsers' main Thread. The library use web worker to create timer
that don't stop when tab is not in focus.

You can use this library if you have time consuming calculation and people switch tabs and
you wan them to be notified when application finish whatever it was doing.

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

## Custom canvas animation

From version 0.4.0 you can use custom canvas animation

```javascript
var p = 0;
var reversed = false;
var width = 2;
var size = 32;
favloader.init({
  size: size,
  frame: function(ctx) {
    ctx.fillStyle = '#F00A0A';
    ctx.fillRect(p, 0, width, size);
    if (reversed) {
      p--;
      if (p === 0) {
        reversed = false;
      }
    } else {
      p++;
      if (p === size - width) {
        reversed = true;
      }
    }
  }
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

## Changelog

### 0.4.4
* allow of multiple start before initialization

### 0.4.3
* throw error when calling start before init

### 0.4.2
* fix clear of animation when calling init when animation is running

### 0.4.1
* README fix
* add parseGIF.min.js file

### 0.4.0
* canvas animation

### 0.3.1
* fix for MacOSX/Chrome
* fix initialization before DOM is ready

### 0.3.0
* GIF animation support

### 0.2.2
* option fix

### 0.2.1
* npm fix

### 0.2.0
* make it work without onload
* change API options

### 0.1.0
* inital version


## License

Copyright (c) 2018-2019 Jakub T. Jankiewicz <https://jcubic.pl/me>

Released under the MIT license
