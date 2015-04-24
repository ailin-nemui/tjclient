'use strict';
var ParseColor = (function() {//
    function htmlescape(text) {
	return text.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    }
    function toHtml(text) {
	var parts = text.split(/(\x04(?:#....|[&-@\xff].|[`-i])|\x1f|\x16)/);
	if (parts.length == 1) {
	    return '<span class="t">' + htmlescape(text) + '</span>';
	}

        var curFgColor = null;
        var curBgColor = null;
	function _defaultAttrs() {
	    return {u:false,r:false,bl:false,b:false,f:false,i:false};
	}
        var curAttrs = _defaultAttrs();

        return parts.map(function(p) {
	    switch (p.charAt(0)) {
	    case "\x1f":
		curAttrs.u = !curAttrs.u;
		return null;
	    case "\x16":
		curAttrs.r = !curAttrs.r;
		return null;
	    case "\x04":
		switch (p.charAt(1)) {
		case 'a':
		    curAttrs.bl = !curAttrs.bl; break;
		case 'c':
		    curAttrs.b = !curAttrs.b; break;
		case 'i':
		    curAttrs.f = !curAttrs.f; break;
		case 'f':
		    curAttrs.i = !curAttrs.i; break;
		case 'g':
		    curAttrs = _defaultAttrs();
		    curFgColor = null;
		    curBgColor = null;
		    break;
		case 'e':
		    /* prefix separator */ break;
		}
		var color;
		if (['.', '-', ',', '+', "'", '&'].indexOf(p.charAt(1)) > -1) {
		    /* extended colour */
		    var ext_color_off = {
			'.' :  [false, 0x10],
			'-' :  [false, 0x60],
			',' :  [false, 0xb0],
			'+' :  [true, 0x10],
			"'" :  [true, 0x60],
			'&' :  [true, 0xb0]
		    };
		    color = ext_color_off[p.charAt(1)][1] - 0x3f + p.charCodeAt(2);
		    if (ext_color_off[p.charAt(1)][0]) {
			curBgColor = 16 + color;
		    }
		    else {
			curFgColor = 16 + color;
		    }
		}
		else if (p.charAt(1) == "#") {
		    /* html colour */
		    var rgbx = [2,3,4,5].map(function(i) { return p.charCodeAt(i); });
		    rgbx[3] -= 0x20;
		    for (var i = 0; i < 3; ++i) {
			if (rgbx[3] & (0x10 << i)) {
			    rgbx[i] -= 0x20;
			}
		    }
		    var _toHex = function (number) {
			var t = number.toString(16);
			return t.length < 2 ? '0' + t : t;
		    };
		    color = '#' + rgbx.splice(0, 3).map(function(e){
			return _toHex(e); }).join('');
		    if (rgbx[3] & 1) {
			curBgColor = color;
		    }
		    else {
			curFgColor = color;
		    }
		}
		else {
		    var colorBase = '0'.charCodeAt(0);
		    var colorBaseMax = '?'.charCodeAt(0);
		    var _ansiBitFlip = function(x) {
			return (x&8) | (x&4)>>2 | (x&2) | (x&1)<<2;
		    };
		    if (p.charCodeAt(1) >= colorBase && p.charCodeAt(1) <= colorBaseMax) {
			curFgColor = _ansiBitFlip(p.charCodeAt(1) - colorBase);
		    }
		    else if (p.charAt(1) == "\xff") {
			curFgColor = null;
		    }
		    if (p.charCodeAt(2) >= colorBase && p.charCodeAt(2) <= colorBaseMax) {
			curBgColor = _ansiBitFlip(p.charCodeAt(2) - colorBase);
		    }
		    else if (p.charAt(2) == "\xff") {
			curBgColor = null;
		    }
		}
		return null;
	    }
	    var ret = {
		bgColor: null,
		fgColor: null,
		attrs: _defaultAttrs(),
		text: p
	    };
	    for (var x in curAttrs) {
		ret.attrs[x] = curAttrs[x];
	    }
	    ret.fgColor = !curAttrs.r ? curFgColor : curBgColor;
	    ret.bgColor = !curAttrs.r ? curBgColor : curFgColor;

	    return ret;
        }).filter(function(p) {
            return p !== null;
        }).map(function(frag) {
	    var classes = ['t'];
	    var styles = [];
	    if ('string' === typeof frag.fgColor && '#' === frag.fgColor.charAt(0)) {
		styles.push("color: " + frag.fgColor);
	    } else if (frag.fgColor !== null) {
		classes.push('fg-'+frag.fgColor);
	    }
	    if ('string' === typeof frag.bgColor && '#' === frag.bgColor.charAt(0)) {
		styles.push("background-color: " + frag.bgColor);
	    } else if (frag.bgColor !== null) {
		classes.push('bg-'+frag.bgColor);
	    }
	    for (var x in frag.attrs) {
		if (frag.attrs[x]) {
		    classes.push(x);
		}
	    }
	    return '<span class="' + classes.join(' ') + '"' +
		(styles.length ? ' style="'+styles.join(';')+'"' : '') + '>' +
		(/^-{10,}$/.test(frag.text)?'<hr/>':htmlescape(frag.text)) + '</span>';
	}).join('');
    }

    return function(msg) {
	return toHtml(msg)
    }
})();

