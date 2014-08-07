var config = require('./config.js'),
    Imap = require('imap'),
    inspect = require('util').inspect;

var imap = new Imap(config.imap);

imap.once('ready', function() {
  imap.openBox('INBOX', true, (function(err, box) {
    if (err) throw err;
    var f = imap.seq.fetch('1:3', {
      bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
      struct: true
    });
    f.on('message', function(msg, seqno) {

      // console.log('Message #%d', seqno);

      msg.on('body', function(stream, info) {

        // if (info.which === 'TEXT')
        //   console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
        var buffer = '', count = 0;
        stream.on('data', function(chunk) {
          count += chunk.length;
          buffer += chunk.toString('utf8');
          if (info.which === 'TEXT')
            console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
        });
        stream.once('end', function() {
          if (info.which !== 'TEXT')
            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
          else
            console.log(prefix + 'Body [%s] Finished', inspect(info.which));
        });
      });

      var prefix = '(#' + seqno + ') ';
      msg.once('attributes', function(attrs) {
        // console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        // console.log(attrs.date);
      });
      msg.once('end', function() {
        // console.log(prefix + 'Finished');
      });
    });
    f.once('error', function(err) {
      console.log('Fetch error: ' + err);
    });
    f.once('end', function() {
      console.log('Done fetching all messages!');
      imap.end();
    });
  }));
});

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
