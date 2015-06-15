var View = function() {
  
}

View.prototype.find_window = function(index, return_selector) {
  index = parseInt(index);
  var found = undefined;
  var found_selector = undefined;
  jQuery('#tablist li').each(function(i, li) {
    if(!found) {
      var possible_index = jQuery(li).data('index')
      if (possible_index == index) {
        found = i
        found_selector = jQuery(li).children('a').attr('href')
      }
    }
  })

  if(return_selector) {
    return found_selector;
  } else {
    return found;
  }
}

View.prototype.find_window_by_attr = function(attr, value) {
  var found = undefined;
  jQuery('#tablist li').each(function(i, li) {
    if(!found) {
      var obj = jQuery(li).data('obj')
      var possible = (obj||{})[attr]
      if (possible == value) {
        found = i
      }
    }
  })

  return found;
}

View.prototype.add_window = function(name, index, level, items, obj) {
  if (!level) {
    level = 0;
  }
  jQuery('#content').tabs('add', '#'+index, this.activity_name(index, level), 0)
  jQuery('#'+index).addClass('container')
  var item = jQuery('#tablist li').get(0)

  jQuery(item).data('index', parseInt(index))
  jQuery(item).data('level', parseInt(level))
  jQuery(item).data('obj', obj)

  this.sort_windows()

  this.set_items(index, items)
}

View.prototype.load_items = function(win) {
  win = parseInt(win)
  var idx = this.find_window(win)
  var li = jQuery('#tablist li').eq(idx)
  var items = jQuery(li).data('items')
  var obj = jQuery(li).data('obj')
  jQuery('#window_item > option').remove()
  for (var i = 0; i < items.length; i++) {
    var item = items[i]
    jQuery('#window_item').append(new Option(item.name, item.name, item.id == obj.active, item.id == obj.active))
  }
}

View.prototype.set_items = function(win, items) {
  win = parseInt(win)
  var idx = this.find_window(win)
  var li = jQuery('#tablist li').eq(idx)
  jQuery(li).data('items', items)
  if (win == this.current_window) {
    this.load_items(win)
  }
}

View.prototype.del_window = function(win) {
  jQuery('#content').tabs('remove', '#'+this.find_window(win))
  this.sort_windows()
}

View.prototype.set_window_activity = function(win, level) {
  /* data_level - 0=no new data, 1=text, 2=msg, 3=highlighted text */
  win = parseInt(win)
  if(win != this.current_window || level == 0) {
    var idx = this.find_window(win)
    var li = jQuery('#tablist li').eq(idx)
    jQuery(li).data('level', level)
    this.rename_window(li)
  }
}

View.prototype.rename_window = function(li) {
  var level = jQuery(li).data('level')
  var winid = jQuery(li).data('index')
  jQuery(li).children('a').text(this.activity_name(winid, level))
}

View.prototype.activity_name = function(cur, level) {
  switch(level) {
    case 0:
      break;
    case 1:
      cur += '+'
      break;
    case 2:
      cur += '*'
      break;
    case 3:
      cur += '!'
      break;
  }
  return cur;
}

View.prototype.set_content = function(win, lines) {
  var win_id = this.find_window(win, true)
  for (var i in lines) {
    jQuery(win_id).append(ParseColor(lines[i].text)+'\n')
  }
  jQuery(win_id).addClass('container')
}

View.prototype.append_message = function(win, msg) {
  var win_id = this.find_window(win, true)
  jQuery(win_id).append(ParseColor(msg)+'\n')
  jQuery(win_id).addClass('container')
}

View.prototype.clear_window = function(win) {
  var win_id = this.find_window(win, true)
  jQuery(win_id).html('')
}

View.prototype.scroll_to_bottom = function(win) {
  var win_id = this.find_window(win, true)
  var tab = jQuery(win_id)[0]
  if (!tab) return
  tab.scrollTop = tab.scrollHeight;  
}

View.prototype.log = function(msg) {
  var now = new Date()
  var time = [now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()]
  this.append_message(0, time.join(':') + ' ==> ' + msg)
}

View.prototype.sort_windows = function(event, ui) {
  var items = jQuery('#tablist li')
  for (var i = 0; i+1 < items.length; i++) {
    var ai = jQuery(items[i]).data('index')
    var bi = jQuery(items[i+1]).data('index')
    if (ai > bi) {
      jQuery('#content').tabs('move', i, 'right')
      this.sort_windows()
    }
  }
}

View.prototype.renumber = function(old, cur) {
  var idx = this.find_window(old)
  var li = jQuery('#tablist li').eq(idx)
  jQuery(li).data('index', cur)
  var sel = jQuery(li).children('a').attr('href')
  jQuery(li).children('a').attr('href', '#'+cur)
  jQuery(sel).attr('id', cur)

  this.rename_window(li)
  this.sort_windows()

  if (old == this.current_window) {
    this.current_window = cur
    idx = this.find_window(this.current_window)
    this.activate_window(idx)
  }
}

View.prototype.activate_window = function(index) {
  jQuery('#content').tabs('select', index);
}

View.prototype.hook_events = function() {
  jQuery(document).keydown(function (e) {
    if (e.altKey) {
      var w = undefined;
      switch(e.keyCode) {
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          w = e.keyCode-48
          if(w == 0) { w = 10 }
          break;
        case 81:
          w = 11
          break;
        case 88:
          w = 12;
          break;
        case 69:
          w = 13
          break;
        case 82:
          w = 14
          break;
        case 84:
          w = 15
          break;
        case 89:
          w = 16
          break;
      }

      if (w) {
        jQuery('#content').tabs('select', w)
      }
    }
  })
}
