/**
 * FreqCountable.js is a script based on Countable.js. Countable.js is a script to allow for
 * live paragraph-, word- and character-counting on an HTML element. FreqCountable.js provides
 * additional functionality by added word and character frequency counters.
 *
 * Countable.js
 * @author		Sacha Schmid (<https://github.com/RadLikeWhoa>)
 * @version		2.1.1
 * @license 	MIT
 * @see			<http://radlikewhoa.github.io/Countable/>
 *
 * FreqCountable.js
 * @author		Stephen Burgess <https://github.com/stephenburgess8>)
 * @version 	0.1.0
 * @license		MIT
 * @see         
 *
 *
 * Table of Contents
 *************************************************
 *
 * Declarations
 * Browser Support
 * Programmatic Functionality
 * String Parsing Functionality
 * **************************** Countable Object
 *
 */



/**
 * Note: For the purpose of this internal documentation, arguments of the type {Nodes} are to be
 * interpreted as either {NodeList} or {Element}.
 *
 */

;(function (global)
{
	'use strict';
	/******************************************************************************* Declarations */
   /**
	* @private
	*
	*`liveElements` holds all elements that have the live-counting functionality bound to them.
	*
	*`input` holds the event to handle the live counting, based on the browser's capabilities.
	*
	*/

	var liveElements = [],
		input = 'oninput' in document ? 'input' : 'keyup';

	/**************************************************************************** Browser Support */
   /**
	* IE9 is a special case. It does not fire an 'input' event when characters are deleted (via
	* DEL key, BACKSPACE key, and CUT). If we want support for those actions we need to use the
	* 'keyup' event instead.
	* more info: http://www.matts411.com/post/internet-explorer-9-oninput/
	*
	*/

	if (navigator.userAgent.match(/MSIE 9.0/))
	{
		input = 'keyup';
	}

   /**
	* `String.trim()` polyfill for non-supporting browsers. This is the recommended polyfill on MDN.
	*
	* @see     <http://goo.gl/uYveB>
	* @see     <http://goo.gl/xjIxJ>
	*
	* @return  {String}  The original string with leading and trailing whitespace removed.
	*
	*/

	if (!String.prototype.trim)
	{
		String.prototype.trim = function ()
		{
			return this.replace(/^\s+|\s+$/g, '')
		}
	}

	/***************************************************************** Programmatic Functionality */
   /**
	* `validateArguments` validates the arguments given to each function call.
	* Errors are logged to the console as warnings, but Countable fails silently.
	*
	* @private
	*
	* @param   {Nodes}     elements  The (collection of) element(s) to validate.
	*
	* @param   {Function}  callback  The callback function to validate.
	*
	* @return  {Boolean}   Returns whether all arguments are vaild.
	*
	*/
	
	function validateArguments (elements, callback)
	{
		var elementsValid = elements &&
				((Object.prototype.toString.call(elements) === '[object NodeList]' &&
				elements.length) || (elements.nodeType === 1)),
			callbackValid = callback && typeof callback === 'function';

		if ('console' in window && 'warn' in console)
		{
			if (!elementsValid)
			{
				console.warn('Countable: No valid elements were found');
			}
			if (!callbackValid)
			{
				console.warn('Countable: "' + callback + '" is not a valid callback function')
			}
		}
		return elementsValid && callbackValid;
	}

	/*************************************************************** String Parsing Functionality */
   /**
	* `ucs2decode` function from the punycode.js library.
	*
	* Creates an array containing the decimal code points of each Unicode character in the string.
	* While JavaScript uses UCS-2 internally, this function will convert a pair of surrogate halves
	*(each of which UCS-2 exposes as separate characters) into a single code point, matching UTF-16.
	*
	* @see     <punycode.ucs2.encode>
	* @see     <https://mathiasbynens.be/notes/javascript-encoding>
	*
	* @param   {String}  string   The Unicode input string (UCS-2).
	*
	* @return  {Array}   The new array of code points.
	*
	*/

	function decode(string)
	{
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;

		while (counter < length)
		{
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length)
			{
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) // low surrogate
				{ 
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				}
				else
				{
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else
			{
				output.push(value);
			}
		}
		return output;
	}

   /**
	* `setOptions` is a function to extend a set of default options with the ones given in the
	* function call. Available options are described below.
	*
	* {Boolean}  hardReturns      Use two returns to seperate a paragraph instead of one.
	*
	* {Boolean}  stripTags        Strip HTML tags before counting the values.
	* {Boolean}  ignoreReturns    Ignore returns when calculating the `all` property.
	*
	* {Boolean}  ignoreZeroWidth  Ignore zero-width space characters.
	*
	* @private
	*
	* @param   {Object}  options  Countable allows the options described above. They can be used
	*                             in a function call to override the default behaviour.
	*
	* @return  {Object}           The new options object.
	*
	*/

	function setOptions (options)
	{
		var defaults =
		{
			hardReturns: false,
			stripTags: false,
			ignoreReturns: false,
			ignoreZeroWidth: true,
			max: 0,
			freqItemCount : 10
		}

		for (var prop in options)
		{
			if (defaults.hasOwnProperty(prop))
			{
				defaults[prop] = options[prop];
			}
		}
		return defaults;
	}

   /**
	*`loop` is a helper function to iterate over a collection, e.g. a NodeList or an Array.
	* The callback receives the current element as the single parameter.
	*
	* @private
	*
	* @param  {Array}     which     The collection to iterate over.
	*
	* @param  {Function}  callback  The callback function to call on each iteration.
	*                               
	*/

	function loop (collection, callback)
	{
		var len = collection.length;

		if (typeof len !== 'undefined')
		{
			while (len--)
			{
				callback(collection[len]);
			}
		}
		else
		{
			callback(collection);
		}
	}

	/**
	*`strip` is a helper function to trim an element's value, optionally stripping HTML tags.
	*
	* The initial implementation to allow for HTML tags stripping was created
	* @craniumslows while the current one was created by @Rob--W.
	*
	* @see <http://goo.gl/Exmlr>
	* @see <http://goo.gl/gFQQh>
	*
	* @private
	*
	* @param   {Element}  element  The element whose value is to be counted.
	*
	* @param   {Object}   options  The options to use for the trimming.
	*
	* @return  {Object}   The trimmed element.
	*                               
	*/

	function strip (element, options)
	{
		var raw = 'value' in element ? element.value : element.innerText || element.textContent;

		if (options.stripTags) { raw = raw.replace(/<\/?[a-z][^>]*>/gi, ''); }
		if (options.ignoreZeroWidth) { raw = raw.replace(/[\u200B]+/, ''); }

		return raw.trim();
	}

	/**
	*`countingSort` is a helper function to sort a frequency map.
	* This sort has O(n) linear complexity.
	*
	* The initial implementation of this count sort was by nehamundada
	*
	* @see <https://github.com/nehamundada/Word_Frequency_counter>
	*
	* @private
	*
	* @param   {Element}  element  The element object to be sorted.
	*
	* @param   {Object}   options  The options to use for sorting.
	*                              default freqItemCount = 10
	*
	* @return  {Object}   The sorted element.
	*                               
	*/

	function countingSort (element, map, options)
	{
		var count = 0,
			top = options.max,
			sorted = [],
			limited = {};
		for (var i = 0; i <= top; i++) { sorted[i] = []; }
        for (var word in map)
        {
        	if (map.hasOwnProperty(word))
        	{ 
        		sorted[map[word]].push(word);
        	}
        }

        while (count < options.freqItemCount)
        {
        	if(typeof sorted[top] !== 'undefined' && sorted[top] !== null && sorted[top].length > 0)
        	{
        		limited[sorted[top].pop()] = top;
        		count++;
        	}
        	else
        	{ 
        		top--;
        		if (typeof sorted[top] === 'undefined' || sorted[top] === null) {
        			count++;
        		}
        		while (sorted[top] === 0) { top--; }
        	}
        }
		return limited;
	}

	/**
	*`freq` counts the frequency of words in an element.
	*
	* @private
	*
	* @param   {Element}  element  The element whose word frequency is to be analyzed
	*
	* @param   {Object}   options  The options to use for the analysis.
	*
	* @return  {Object}   The object containing the frequency of words.
	*
	*/

	function freq (element, options)
	{		
		var words = [],
			wordCount = 0,
			wordFreqMap = {},
			trimmed = strip(element, setOptions(options));

		words = trimmed ? (trimmed.replace(/['";:,.?¿\-!¡]+/g, '').match(/\S+/g) ||
						[]) : 0;
		wordCount = words ? words.length : 0;

		if (wordCount == 0) { return; }
		options.max = 1;
		for (var word in words)
		{
            if (wordFreqMap.hasOwnProperty(words[word]))
            {
            	wordFreqMap[words[word]] = wordFreqMap[words[word]] + 1;
            	if(wordFreqMap[words[word]] > options.max)
            	{ 
            		options.max = wordFreqMap[words[word]]; 
            	};
            }
	        else { wordFreqMap[words[word]] = 1;}
        }

        if (options.freqItemCount > wordCount) { options.freqItemCount = wordCount }
        else if (options.freqItemCount <= 0) { options.freqItemCount = 10; }

		return countingSort(words, wordFreqMap, options);
	}


   /**
	*`count` counts paragraphs, sentences, words, characters and characters plus spaces.
	*
	* @private
	*
	* @param   {Element}  element  The element whose value is to be counted.
	*
	* @param   {Object}   options  The options to use for the counting.
	*
	* @return  {Object}   The object containing the number of paragraphs, sentences, words, 
	*                     characters and characters plus spaces.
	*
	*/

	function count (element, options)
	{
		var trimmed = strip(element, options);

		/**
		* Most of the performance improvements are based on the works of @epmatsw.
		*
		* @see <http://goo.gl/SWOLB>
		*
		*/

		return {
			paragraphs: trimmed ? (trimmed.match(options.hardReturns ? /\n{2,}/g : /\n+/g) ||
				[]).length + 1 : 0,
			sentences: trimmed ? (trimmed.match(/[.?!…]+./g) || []).length + 1 : 0,
			words: trimmed ? (trimmed.replace(/['";:,.?¿\-!¡]+/g, '').match(/\S+/g) ||
				[]).length : 0,
			characters: trimmed ? decode(trimmed.replace(/\s/g, '')).length : 0,
			all: decode(options.ignoreReturns ? element.replace(/[\n\r]/g, '') : element).length
		}
	}

/******************************************************************************* Countable Object */
   /**
	* This is the main object that will later be exposed to other scripts. It holds all the public
	* methods that can be used to enable the Countable functionality.
	*
	*/

	var Countable = 
	{
		/**
		* The `live` method binds the counting handler to all given elements. The
		* event is either `oninput` or `onkeydown`, based on the capabilities of
		* the browser.
		*
		* @param   {Nodes}     elements   All elements that should receive the Countable
		*                                 functionality.
		*
		* @param   {Function}  callback   The callback to fire whenever the  element's value
		*                                 changes. The callback is called with the relevant element
		*                                 bound to `this` and the counted values as the
		*                                 single parameter.
		*
		* @param   {Object}    [options]  An object to modify Countable's behaviour. Refer to
		*                                `setOptions' for a list of available options.
		*
		* @return  {Object}               Returns the Countable object to allow for chaining.
		*
		*/

		live: function (elements, callback, options)
		{
			var bind = function (element)
			{
				var handler = function ()
				{
					callback.call(element, count(element, setOptions(options)));
				};

				liveElements.push({
					element: element,
					handler: handler
				});

				handler();

				if (element.addEventListener)
				{
					element.addEventListener(input, handler, false);
				}
				else if (element.attachEvent) {	element.attachEvent('on' + input, handler);	}
			};

			if (!validateArguments(elements, callback)) { return; }

			if (elements.length) { loop(elements, bind); }
			else { bind(elements); }
			return this;
		},

		/**
		* The `freq` method binds the frequency analysis handler to all given elements. The
		* event is either `oninput` or `onkeydown`, based on the capabilities of the browser.
		*
		* @param   {Nodes}     elements   All elements that should receive the Countable
		*                                 functionality.
		*
		* @param   {Function}  callback   The callback to fire whenever the  element's value
		*                                 changes. The callback is called with the relevant element
		*                                 bound to `this` and the counted values as the
		*                                 single parameter.
		*
		* @param   {Object}    [options]  An object to modify Countable's behaviour. 
		*                                 Set number of most frequent words to return.
		*
		* @return  {Object}               Returns the Countable object to allow for chaining.
		*
		*/

		freq: function(elements, callback, options)
		{
			var bind = function (element)
			{
				var handler = function ()
				{	
					callback.call(element, freq(element, setOptions(options)));
				};

				liveElements.push({
					element: element,
					handler: handler
				});

				handler();

				if (element.addEventListener)
				{
					element.addEventListener(input, handler, false);
				}
				else if (element.attachEvent) {	element.attachEvent('on' + input, handler);	}
			};

			if (!validateArguments(elements, callback)) { return; }

			if (elements.length) { loop(elements, bind); }
			else { bind(elements); }
			return this;
		},

	   /**
		* The `die` method removes the Countable functionality from all given elements.
		*
		* @param   {Nodes}  elements  All elements whose Countable functionality should be unbound.
		*
		* @return  {Object}  Returns the Countable object to allow for chaining.
		*
		*/

		die: function (elements)
		{
			if (!validateArguments(elements, function () {})) { return; }

			loop(elements, function (element)
			{
				var liveElement;

				loop(liveElements, function (live) {
					if (live.element === element) { liveElement = live; } });

				if (!liveElement) { return; }

				if (element.removeEventListener) 
				{
					element.removeEventListener(input, liveElement.handler, false);
				}
				else if (element.detachEvent)
				{
					element.detachEvent('on' + input, liveElement.handler);
				}

				liveElements.splice(liveElements.indexOf(liveElement), 1);
			});

			return this;
		},

	   /**
		* The `once` method works mostly like the `live` method, but no events are bound,
		* the functionality is only executed once.
		*
		* @alias   Countable.count
		*
		* @param   {Nodes}     elements   All elements that should receive the Countable
		*								  functionality.
		*
		* @param   {Function}  callback   The callback to fire whenever the element's value changes.
		*								  The callback is called with the relevant element bound
		*                                 to `this` and the counted values as the single parameter.
		*
		* @param   {Object}    [options]  An object to modify Countable's behaviour. Refer to
		*                                `setOptions` for a list of available options.
		*
		* @return  {Object}   		      Returns the Countable object to allow for chaining.
		*
		*/

		once: function (elements, callback, options)
		{
			if (!validateArguments(elements, callback)) { return; }

			loop(elements, function (element)
			{
				callback.call(element, count(element, options));
			});

			return this;
		},

		onceFreq: function (elements, callback, options)
		{
			if (!validateArguments(elements, callback)) { return; }

			loop(elements, function (element)
			{
				callback.call(element, freq(element, setOptions(options)));
			});

			return this;
		},

		count: function (elements, callback, options)
		{
			return this.once(elements, callback, options);
		},

	   /**
		* The `enabled` method checks if the live-counting functionality is bound to an element.
		*
		* @param   {Element}  element  A single Element.
		*
		* @return  {Boolean}  A boolean value representing whether Countable functionality is bound
		*                     to the given element.
		*
		*/

		enabled: function (element)
		{
			var isEnabled = false;

			if (element && element.nodeType === 1)
			{
				loop(liveElements, function (live)
				{
					if (live.element === element) { isEnabled = true; }
				});
			}

			return isEnabled;
		}
	}

   /**
	* Expose Countable depending on the module system used across the application.
	* (Node / CommonJS, AMD, global)
	*
	*/

	if (typeof exports === 'object')
	{
		module.exports = Countable;
	}
	else if (typeof define === 'function' && define.amd)
	{
		define(function () { return Countable });
	}
	else
	{
		global.Countable = Countable;
	}
	
}(this));