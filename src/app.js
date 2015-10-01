var UI = require('ui');
var ajax = require('ajax');

var public_key = 'g6xRyzmG2KI6XX299yZK';
var private_key = '';
var schema = [
    {
      label: 'Time',
      type: 'current_time'
    },
    {
      label: 'Direction',
      type: 'choice',
      choices: ['North', 'South']
    },
    {
      label: 'Route',
      type: 'choice',
      choices: ['Farragut Crossing', 'Metro Center']
    },
    {
      label: 'Duration',
      type: 'duration'
    },
];
  
var isoformat = function (d) {
  var pad = function(num) {
    var norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
};

var data_entries = [];
for (var i in schema) {
  var entry = {title: schema[i].label};
  switch (schema[i].type) {
    case 'current_time':
      entry.subtitle = isoformat(new Date());
      break;
    case 'choice':
      entry.subtitle = schema[i].choices[0];
      break;
    case 'duration':
      entry.subtitle = '00:00';
      break;
  }
  data_entries.push(entry);
}


var main = new UI.Menu({
  sections: [{
    title: "Enter Data",
    items: data_entries
  },{
    title: "Submit Data",
    items: [{
      title: 'Upload',
      subtitle: 'to data.sparkfun'
    }]
  }]
});
main.on('select', function(e) {
  var i = e.itemIndex;
  if (e.sectionIndex == 0) {
    switch (schema[i].type) {
      case 'choice':
        var next_choice = (schema[i].choices.indexOf(e.item.subtitle) + 1) % schema[i].choices.length;
        main.item(0, i, {subtitle: schema[i].choices[next_choice]});
        break;
      case 'duration':
        if (schema[i].interval_id) {
          clearInterval(schema[i].interval_id);
          schema[i].interval_id = null;
        } else {
          schema[i].start_time = Date.now();
          schema[i].interval_id = setInterval(function() {
            var time = (Date.now() - schema[i].start_time) / 1000;
            var minutes = Math.floor(time / 60);
            var seconds = Math.floor(time - minutes * 60);
            if (minutes < 10) minutes = '0' + minutes.toString();
            if (seconds < 10) seconds = '0' + seconds.toString();
            main.item(0, i, {subtitle: minutes + ':' + seconds});
          }, 1000);
        }
        break;
      case 'current_time':
        main.item(0, i, {subtitle: isoformat(new Date())});
        break;
    }
  } else {
    var card = new UI.Card({
      title: 'Uploading',
      body: 'In progress...',
      scrollable: true,
    });
    card.show();
    var entry = {};
    var menu_items = e.menu.items(0);
    for (var j in menu_items) entry[menu_items[j].title.toLowerCase()] = menu_items[j].subtitle;
    ajax({
           url: 'https://data.sparkfun.com/input/' + public_key,
           type: 'json',
           method: 'post',
           headers: {'Phant-Private-Key': private_key},
           data: entry
         }, function(data, status, request) {
           card.title('Done');
           card.body(data);
         }, function(error, status, request) {
           card.title('Done');
           card.body(error);
         });
  }
});
main.show();