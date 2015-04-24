var Handler = function(ws, view) {
  this.ws = ws;
  this.view = view
}

Handler.prototype.trigger = function(msg) {
  this.ws.send(JSON.stringify(msg))
}

Handler.prototype.authenticate = function(password) {
  this.authdata = { key: Math.random().toString(36).substr(2),
		    password: password, };
  this.trigger({
    challenge: this.authdata.key,
  })
}

Handler.prototype.challenge = function(msg) {
  var authdata = this.authdata;
  delete this.authdata;
  this.trigger({
    login: CryptoJS
      .HmacSHA256(authdata.password, msg + authdata.key)
      .toString(CryptoJS.enc.Base64).replace(/=$/,'')
  })
}

Handler.prototype.login = function(msg) {
  this.configure()
  this.listwindows()
}

Handler.prototype.configure = function() {
  this.trigger({
    line: {sub: {add: {lv:0, text: true}}},
    window: {sub: {ex: {lv:1}, attr: {}, act: {}}},
    item: {sub: {ex: {lv:1}}},
  })
}

Handler.prototype.listwindows = function() {
  this.trigger({
    id: 'windowlist',
    window: {get: {lv:1}},
    item: {get: {lv:1}},
  })
}

Handler.prototype.windowlist = function(msg) {
  var self = this;
  var active = 0;
  for(var i = 0; i < msg.window.get.length; i++) {
    var win = msg.window.get[i]
    var items = []

    if (win.active_win) {
      active = win.refnum
    }
    for(var j = 0; j < msg.item.get.length; j++) {
      var item = msg.item.get[j]
      if (item.window == win.id) {
	items.push(item)
	if (item.id == win.active) {
	  win.name = item.visible_name
	}
      }
    }
    
    self.view.add_window(win.name, win.refnum, win.data_level, items, win);
  }
  self.view.activate_window(active)
}

Handler.prototype.getscrollback = function(win) {
  var req = {
    lv: 0,
    count: 100,
    text: true,
  }
  var idx = this.view.find_window(win)
  var li = jQuery('#tablist li').eq(idx)
  req[jQuery(li).data('obj').view]={}
  this.scrollback_window = win;
  this.trigger({
    id: 'scrollback',
    line: {get: req}
  })
}

Handler.prototype.scrollback = function(msg) {
  var win = this.scrollback_window
  delete this.scrollback_window
  var idx = this.view.find_window(win)
  var li = jQuery('#tablist li').eq(idx)
  var view_id = jQuery(li).data('obj').view
  this.view.set_content(win, msg.line.get[view_id])
  this.view.scroll_to_bottom(win)
}

Handler.prototype.activewindow = function(win) {
  this.trigger({
    input: {command: "window goto " + win}
  })
  this.view.set_window_activity(win, 0)
}

Handler.prototype["line added"] = function(msg) {
  var idx = this.view.find_window(this.view.current_window)
  var li = jQuery('#tablist li').eq(idx)
  var view_id = jQuery(li).data('obj').view
  if (msg[view_id] !== undefined) {
    this.view.set_content(this.view.current_window, msg[view_id]);
    this.view.scroll_to_bottom(this.view.current_window)
  }
}

Handler.prototype["window created"] = function(msg) {
  this.view.add_window(msg.name, msg.refnum, msg.data_level, [], msg);
}

Handler.prototype["window destroyed"] = function(msg) {
  this.view.del_window(this.view.find_window_by_attr('id', msg))
}

Handler.prototype["window item changed"] = function(msg) {
  var idx = this.view.find_window_by_attr('id', msg.id)
  var li = jQuery('#tablist li').eq(idx)
  var obj = jQuery(li).data('obj')
  if (!obj) return
  obj.active = msg.active
  jQuery(li).data('obj', obj)
  this.view.set_items(idx, jQuery(li).data('items'))
}

Handler.prototype["window item new"] = function(msg) {
  var idx = this.view.find_window_by_attr('id', msg.window)
  var li = jQuery('#tablist li').eq(idx)
  var items = jQuery(li).data('items')
  items.push(msg)
  this.view.set_items(idx, items)
}

Handler.prototype.unhandled = function(msg) {
  this.view.log(JSON.stringify(msg));
}

Handler.prototype.sendcommand = function(win, msg) {
  if(win > 0) {
    this.trigger({
      input: {active: true, data: msg}
      // window: win,
    })
  }
}

Handler.prototype["window activity"] = function(msg) {
  var idx = this.view.find_window_by_attr('id', msg.id)
  this.view.set_window_activity(idx, msg.data_level)
}

Handler.prototype["window refnum changed"] = function(msg) {
  this.view.renumber(msg["old refnum"], msg.refnum)
}

Handler.prototype.activeitem = function(win, item) {
  if (win > 0) {
    this.trigger({
      input: {active: true, command: "window item goto " + item},
    })
  }
}

Handler.prototype.listitems = function(win) {
  if (win > 0) {
    this.itemlist_window = win;
    var idx = this.view.find_window(win)
    var li = jQuery('#tablist li').eq(idx)
    var obj = jQuery(li).data('obj')
    this.trigger({
      id: 'itemlist',
      item: { get: { lv: 1, window: obj.id } },
    })
  }
}

Handler.prototype.itemlist = function(msg) {
  var win = this.itemlist_window
  delete this.itemlist_window
  this.view.set_items(win, msg.item.get)
}
