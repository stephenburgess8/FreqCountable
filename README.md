# FreqCountable

[![License](http://img.shields.io/badge/license-MIT-orange.svg)](https://github.com/RadLikeWhoa/Countable/blob/master/LICENSE.md)

FreqCountable is a JavaScript function to add **live paragraph-, word- and character-counting** to an HTML element. 

```
=> <textarea id="text"></textarea>, { all: 0, characters: 0, paragraphs: 0, words: 0 }
```

Property   | Meaning
---------- | --------------------------------------------------------------------------------------------
paragraphs | The number of paragraphs. Paragraphs can be separated by either a soft or a hard (two line breaks) return. To use hard returns, set the corresponding option (`hardReturns`).
words      | The number of words. Words are split using spaces.
characters | The number of characters (without spaces). This contains all non-whitespace characters.
all        | The number of characters including whitespace. This is the total number of all characters in the element.

### Options

`Countable.live()` and `Countable.once()` both accept a third argument, an options object that allows you to change how Countable treats certain aspects of your element's text.

```javascript
{
  hardReturns: false,
  stripTags: false,
  ignoreReturns: false
}
```

By default, paragraphs are split by a single return (a soft return). By setting `hardReturns` to true, Countable splits paragraphs after two returns.

Depending on your application and audience, you might need to strip HTML tags from the text before counting it. You can do this by setting `stripTags` to true.

In most cases, returns should be counted as part of the `all` property. Set `ignoreReturns` to false to remove them from the counter.

## Browser Support

Countable supports all modern browsers. Internet Explorer is supported down to version 7. Note that some browsers don't implement the `oninput` event consistently so there might be differences in the way Countable works in different browsers.

## Upgrading from version 1

Upgrading from version 1.x.x is easy. Most likely, you've used something like the following:

```javascript
var area = document.getElementById('area')

new Countable(area, function (counter) {
  console.log(counter)
}, { stripTags: true })
```

The new syntax offers more functions as described above, but to keep the live-counting functionality, you just write this:

```javascript
var area = document.getElementById('area')

Countable.live(area, function (counter) {
  console.log(counter)
}, { stripTags: true })
```

* The callback parameter is no longer optional
* `options.once` has been replaced with `Countable.once()`
* `Countable.live()` and `Countable.once()` both accept one or more elements, rather than just a single one
* Inside the callback, `this` is now bound to the current element
