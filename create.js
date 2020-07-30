function rimg(){
  image = document.createElement('img');
  image.src= URL.createObjectURL($("#rawimg")[0].files[0]);
  image.width = 128
  $("#rimg").html("");
  $("#rimg")[0].appendChild(image)
  image.onload = function(){
      var nw=image.naturalWidth
      var nh=image.naturalHeight
      console.log(nh);
  }
}
//rimg()



 var maxMessageSize = 10000

 function showerr(body){
    $("#err").html('<div class="alert alert-dismissable alert-danger"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h4>错误!</h4>'+body+'</div>');
}

 var encode = function() {
    var message = $("#plain_text").val();
    var password = $("#passf").val();
    var output = document.getElementById('output');
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    // encrypt the message with supplied password if necessary
    if (password.length > 0) {
        if (password.length<5){
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
    console.log("CIMG")
    cimg();
    // encode the encrypted message with the supplied password
    var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    encodeMessage(imgData.data, sjcl.hash.sha256.hash(password), message);
    ctx.putImageData(imgData, 0, 0);

    // view the new image
    console.log('Done');
    
    output.src = canvas.toDataURL();

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

