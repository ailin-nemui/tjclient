/* http://nuggethub.com/nuggets/extend-the-jquery-ui-tabs-control-to-support-moving-tabs-left-and-right */
$.extend($.ui.tabs.prototype, {
    move: function(index, direction) {
        var self = this, o = this.options;

        var li = this.lis.eq(index);
        if (direction == "left") {
            var prev = $(li).prev();
            if ($(prev).length > 0) {
                $(prev).before(li);
            }
        } else if (direction == "right") {
            var next = $(li).next();
            if ($(next).length > 0) {
                $(next).after(li);
            }
        } else {
            return; //Invalid direction
        }

        this._tabify();

        var href = $(li).children("a").attr("href");
        this._trigger('move', null, this._ui(li, $(href)));
    }
});
