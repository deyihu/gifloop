# gifloop

play gif image, gif decode base on [gifuct-js](https://github.com/matt-way/gifuct-js)

## Examples

[draw gif by canvas](https://deyihu.github.io/gifloop/test/base.html)  
[draw gif by maptalks symbol system](https://deyihu.github.io/gifloop/test/maptalks.html)  

## Install

* CDN

```html
<script src="https://unpkg.com/gifloop/dist/gifloop.js"></script>
```

* NPM

```sh
npm i gifloop
# or
yarn add gifloop
```

## API

### `GIF` class

#### constructor(options)

  + options
    - {Number} loopTime:`default value is 70ms`
    - {String} url:`gif file url`

```js
import {
    GIF
} from 'gifloop';
const gif = new GIF({
    loopTime: 70,
    url: './people.gif'
});
gif.on('frame', function(frame) {
    //do somethings
});

//if you use cdn
const gif = new gifloop.GIF({
    loopTime: 70,
    url: './people.gif'
});
```

####  method

  + config(options) `update options`

```js
gif.config({
    loopTime: 100
});
```

  + on(event, handler) `Listen for events`

```js
gif.on('frame', function(frame) {
    //do somethings
});
```

  + off(event, handler) `remove Listen for events`
  + play() 
  + pause() 
  + isPlay() 

```js
   if (gif.isPlay()) {
       gif.pause();
   } else {
       gif.play();
   }
```

  + dispose() 
  

```js
gif.dispose();
```

    
