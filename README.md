# favloader

Vanilla JavaScript library for loading animation in favicon that work when tab is not active

## Why this library

Basic solution with animation using canvas don't work out of the box because of limitation of timer functions in Browsers' main
Thread. The library use web worker to create timer that don't stop when tab is not in focus.

You can use this library if you have time consuming calculation and people switch tabs and you wan them to notify them when
application finish what ever it was doing.

## API

Initalization

```javascript
favloader.init({
   favicon_size: 16,
   line_width: 2,
   color: '#0F60A8',
   duration: 5000
});
```

Start animating

```javascript
favloader.start();
```

```javascript
favloader.stop();
```

Looks best if you don't have lot of tabs or if you do when tab is not in focus

## License

Copyright (c) 2018 Jakub Jankiewicz <http://jcubic.pl/me>

Released under the MIT license
