function showerr(body){
    $("#err").html('<div class="alert alert-dismissable alert-danger"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h4>错误!</h4>'+body+'</div>');
}
// artificially limit the message size
var maxMessageSize = 10000;

function rimg(){
  image = document.createElement('img');
  image.src= URL.createObjectURL($("#rawimg")[0].files[0]);
  image.width = 128
  $("#rimg").html("");
  $("#rimg")[0].appendChild(image)
  image.onload = function(){
      var nw=image.naturalWidth
      var nh=image.naturalHeight
            var ctx = document.getElementById('canvas').getContext('2d');
            ctx.canvas.width = nw;
            ctx.canvas.height = nh+50;
            ctx.fillStyle = '#ffffff';
              ctx.fillRect(0,nh,nw,50);
            ctx.drawImage(image, 0, 0);

            img = document.createElement('img');
            img.src="lock.png"
            img.onload=function(){

             for (i = 0; i < nw/50; i++) { 
               ctx.drawImage(img,i*50, nh,50,50);
               }
            ctx.fillStyle = '#000000';
            ctx.font = "40px serif";
            ctx.fillText("此图片包含隐藏内容 请保存后扫码查看", 10, nh+40 );
            

              }
qmg = document.createElement('img');
            qmg.src="decode.png"
            qmg.onload=function(){ctx.drawImage(qmg, nw-110, nh-60,100,100);}

            
  }
}

function simg(){
  console.log("s");
  image = document.createElement('img');
  image.src= URL.createObjectURL($("#shimg")[0].files[0]);
  image.width = 128
  $("#ssimg").html("");
  $("#ssimg")[0].appendChild(image)
  image.onload = function(){
      var nw=image.naturalWidth
      var nh=image.naturalHeight
      var ctx = document.getElementById('canvas').getContext('2d');
            ctx.canvas.width = nw;
            ctx.canvas.height = nh;
            ctx.drawImage(image, 0, 0);

}

}


// encode the image and save it
var encode = function() {
    var message = document.getElementById('message').value;
    var password = document.getElementById('password').value;
    var output = document.getElementById('output');
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    // encrypt the message with supplied password if necessary
    if (password.length > 0) {        if (password.length<5){
            showerr("<strong>密码太短</strong>由于安全原因，当指定密码时，密码长度应大于等于六位");
            return;
        }
        message = sjcl.encrypt(password, message);
    } else {
        message = JSON.stringify({'text': message});
    }

    // exit early if the message is too big for the image
    var pixelCount = ctx.canvas.width * ctx.canvas.height;
    if ((message.length + 1) * 16 > pixelCount * 4 * 0.75) {
        showerr('<strong>图片太小</strong>不够容纳信息');
        return;
    }

    // exit early if the message is above an artificial limit
    if (message.length > maxMessageSize) {
        showerr('<strong>文本过长</strong>为了防止页面崩溃，禁止长度超过一万字的文本。请删除一些文本。');
        return;
    }

    // encode the encrypted message with the supplied password
    var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    encodeMessage(imgData.data, sjcl.hash.sha256.hash(password), message);
    ctx.putImageData(imgData, 0, 0);

    // view the new image
    console.log('Done');

    output.src = canvas.toDataURL();

};

// decode the image and display the contents if there is anything
var decode = function() {
    console.log("decode");
    var password = document.getElementById('password2').value;
    var passwordFail = '密码错误或不存在隐藏信息。可能是由于图片在传输过程中被压缩。';

    // decode the message with the supplied password
    var ctx = document.getElementById('canvas').getContext('2d');
    var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    var message = decodeMessage(imgData.data, sjcl.hash.sha256.hash(password));
    console.log("decoded")
    if(!$("#agreeTOS")[0].checked){showerr("请同意许可协议。");return;}

    // try to parse the JSON
    var obj = null;
    try {
        console.log("LOADING")
        obj = JSON.parse(message);
    } catch (e) {
        // display the "choose" view

        //document.getElementById('choose').style.display = 'block';
        //document.getElementById('reveal').style.display = 'none';
        
        if (password.length > 0) {
            showerr(passwordFail);
            return;
        }
    }

    // display the "reveal" view
    if (obj) {
        //document.getElementById('choose').style.display = 'none';
        //document.getElementById('reveal').style.display = 'block';

        //// decrypt if necessary
        if (obj.ct) {
            try {
                obj.text = sjcl.decrypt(password, message);
            } catch (e) {
                showerr(passwordFail);
                return;
            }
        }

        // escape special characters
        var escChars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;',
            '/': '&#x2F;',
            '\n': '<br/>'
        };
        var escHtml = function(string) {
            return String(string).replace(/[&<>"'\/\n]/g, function (c) {
                return escChars[c];
            });
        };
        document.getElementById('messageDecoded').innerHTML = escHtml(obj.text);
    }
};

// returns a 1 or 0 for the bit in 'location'
var getBit = function(number, location) {
   return ((number >> location) & 1);
};

// sets the bit in 'location' to 'bit' (either a 1 or 0)
var setBit = function(number, location, bit) {
   return (number & ~(1 << location)) | (bit << location);
};

// returns an array of 1s and 0s for a 2-byte number
var getBitsFromNumber = function(number) {
   var bits = [];
   for (var i = 0; i < 16; i++) {
       bits.push(getBit(number, i));
   }
   return bits;
};

// returns the next 2-byte number
var getNumberFromBits = function(bytes, history, hash) {
    var number = 0, pos = 0;
    while (pos < 16) {
        var loc = getNextLocation(history, hash, bytes.length);
        var bit = getBit(bytes[loc], 0);
        number = setBit(number, pos, bit);
        pos++;
    }
    return number;
};

// returns an array of 1s and 0s for the string 'message'
var getMessageBits = function(message) {
    var messageBits = [];
    for (var i = 0; i < message.length; i++) {
        var code = message.charCodeAt(i);
        messageBits = messageBits.concat(getBitsFromNumber(code));
    }
    return messageBits;
};

// gets the next location to store a bit
var getNextLocation = function(history, hash, total) {
    var pos = history.length;
    var loc = Math.abs(hash[pos % hash.length] * (pos + 1)) % total;
    while (true) {
        if (loc >= total) {
            loc = 0;
        } else if (history.indexOf(loc) >= 0) {
            loc++;
        } else if ((loc + 1) % 4 === 0) {
            loc++;
        } else {
            history.push(loc);
            return loc;
        }
    }
};

// encodes the supplied 'message' into the CanvasPixelArray 'colors'
var encodeMessage = function(colors, hash, message) {
    // make an array of bits from the message
    var messageBits = getBitsFromNumber(message.length);
    messageBits = messageBits.concat(getMessageBits(message));

    // this will store the color values we've already modified
    var history = [];

    // encode the bits into the pixels
    var pos = 0;
    while (pos < messageBits.length) {
        // set the next color value to the next bit
        var loc = getNextLocation(history, hash, colors.length);
        colors[loc] = setBit(colors[loc], 0, messageBits[pos]);

        // set the alpha value in this pixel to 255
        // we have to do this because browsers do premultiplied alpha
        // see for example: http://stackoverflow.com/q/4309364
        while ((loc + 1) % 4 !== 0) {
            loc++;
        }
        colors[loc] = 255;

        pos++;
    }
};

// returns the message encoded in the CanvasPixelArray 'colors'
var decodeMessage = function(colors, hash) {
    // this will store the color values we've already read from
    var history = [];

    // get the message size
    var messageSize = getNumberFromBits(colors, history, hash);

    // exit early if the message is too big for the image
    if ((messageSize + 1) * 16 > colors.length * 0.75) {
        return '';
    }

    // exit early if the message is above an artificial limit
    if (messageSize === 0 || messageSize > maxMessageSize) {
        return '';
    }

    // put each character into an array
    var message = [];
    for (var i = 0; i < messageSize; i++) {
        var code = getNumberFromBits(colors, history, hash);
        message.push(String.fromCharCode(code));
    }

    // the characters should parse into valid JSON
    return message.join('');
};