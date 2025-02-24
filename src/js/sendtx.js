// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// var ScdoClient = require('./src/api/scdoClient');
const BigNumber = require('bignumber.js');
const i18n = new(require('./translations/i18n.js'));
// scdoClient = new ScdoClient();

// onload = function() {
//     document.getElementById("sendtx").addEventListener("click", sendtx);
//     document.getElementById("btn_gettx").addEventListener("click", gettxbyhash);
// }
function addLoadEvent(func) {
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    } else {
        window.onload = function() {
            oldonload();
            func();
        }
    }
}
var validator;
addLoadEvent(function() {
    document.getElementById("sendtx").addEventListener("click", sendtx);
    //document.getElementById("btn_gettx").addEventListener("click", gettxbyhash);
    $('#to').on('change',function(e){
        if(validator.element("#to")){
            var from = document.getElementById("txPublicKey").value;
            var to = this.value;
            getEstimateGas(from,to);
            detectShards(from,to);
        }
    });
    $('#amount').on('input',function(e){
        if(validator.element("#amount")){
            document.getElementById("txamount1").innerText=Math.abs(this.value);
            // document.getElementById("txamount2").innerText=Math.abs(this.value);
            var estimatedgas = document.getElementById("estimatedgas").innerText;
            var gasPrice = $('#gasPrice').slider("value");
            var total = BigNumber(gasPrice).times(parseFloat(estimatedgas)).div(100000000).plus(parseFloat(this.value));
            document.getElementById("totalamount").innerText=total;
        }
    });
    $( "#gasPrice" ).on( "slidestop", function( event, ui ) {
        if(validator.element("#amount")){
            amount = document.getElementById("amount").value;
        }else{
            amount= "0.0";
        }
        var estimatedgas = document.getElementById("estimatedgas").innerText;
        var total = BigNumber(ui.value).times(parseFloat(estimatedgas)).div(100000000).plus(parseFloat(amount));
        document.getElementById("totalamount").innerText=total;
    } );

    // switchLanguage()

    validator = $('form[id="txform"]').validate({
        // Specify validation rules
        rules: {
          // The key name on the left side is the name attribute
          // of an input field. Validation rules are defined
          // on the right side
          txpublicKey: "required",
          to: {
              required:true,
              rangelength:[42,42]
          },
          accountpassword: {
              required:true
          },
          amount:{
              required:true,
              number:true,
              fixedPrecision:9
          }
        },
        // Specify validation error messages
        messages: {
            txpublicKey: "Please enter your account address",
            to: {
                required:"Please enter a valid to address",
                rangelength:"Not a valid address"
            },
            accountpassword:{
                required:"Please enter your account password"
            },
            amount:{
                required:"Please enter the transfer amount",
                number:"Amount should be a valid number",
                fixedPrecision:"The max precision is 8"
            }
        }
      });
})

function sendtx() {

    if(!validator.form()){
        return;
    }

    var account = document.getElementById("txAccount");
    var to = document.getElementById("to");
    var amount = document.getElementById("amount");
    // var price = document.getElementById("price");
    var accountpassWord = document.getElementById("accountpassWord")
    var estimatedgas = document.getElementById("estimatedgas").innerText;
    var gasPrice = $('.progress').slider("value");
    var requested = false;
    console.log("request value:", requested.toString());
    if (client == undefined) {
        var ScdoClient = require('./src/api/scdoClient');
        client = new ScdoClient();
    }
    if(!MSGJSON){
         const fs = require('fs');
         MSGJSON = JSON.parse(fs.readFileSync(client.langPath.toString()).toString());
    } 
    const lang = document.getElementById("lang").value;

    // setTimeout(function(){
    //   console.log("timeout request value:", requested.toString());
    //   if (!requested) {
    //     // const fs = require('fs');
    //     // var json = JSON.parse(fs.readFileSync(scdoClient.langPath.toString()).toString());
    //     // const lang = document.getElementById("lang").value
    //     alert(MSGJSON[lang]["broadcastError"])
    //   }
    // }, 50*1000);

    layer.load(0, { shade: false });
    console.log(account.value, to.value, amount.value, gasPrice, estimatedgas);

    client.sendtx(account.value, accountpassWord.value, to.value, amount.value, gasPrice, estimatedgas, "", function(result, err, hash, txRecord) {
        layer.closeAll();
        console.log("try: ", result, err, hash, txRecord);
        requested = true;
        console.log("sendtx request value", requested)
        if (err) {
            console.log("if: ", result, err, hash, txRecord);
            layer.alert(err.message);
        } else {
            console.log("else: ", result, err, hash, txRecord);
            // const fs = require('fs');
            // var json = JSON.parse(fs.readFileSync(client.langPath.toString()).toString());
            const lang = document.getElementById("lang").value
            const createwarning0 = MSGJSON[lang]["saveWarning0"];
            const message = MSGJSON[lang]["transactionSent"]+"<br/>"+createwarning0+"<br/>"+hash;
            // scdoClient.txArray.push(hash)
            // layer.alert(message)
            layer.msg(message,{
                time:false,
                btn:i18n.__("OK"),
                yes:function(index,layero){
                    navigator.permissions.query({name: "clipboard-write"}).then(result => {
                        if (result.state == "granted" || result.state == "prompt") {
                          navigator.clipboard.writeText(hash).then(
                            function() {
                          }, function() {
                            console.log("failed, but still permitted")
                          });
                        }
                      });
                      client.txArray.push({"name":hash,"time":new Date().getTime()})
                      client.saveRecord(txRecord);
                      location.reload()
                }
            })
            
        }
        console.log("end: ", result, err, hash, txRecord);
    });

    // reset everything
    console.log("resetting");
    document.getElementById("accountpassWord").value='';
    document.getElementById("amount").value='';
    document.getElementById("to").value='';
    document.getElementById("txamount1").innerText='0.00';
    // document.getElementById("txamount2").innerText='0';
    document.getElementById("totalamount").innerText='0.00021000';

}

function gettxbyhash() {
    var txresult = document.getElementById("txresult")
    var publicKey = document.getElementById("txpublicKey");
    if (client == undefined) {
        var ScdoClient = require('./src/api/scdoClient');
        client = new ScdoClient();
    }
    client.gettxbyhash(txresult.innerHTML, publicKey.value, function(info, err) {
        if (err) {
            alert(err)
        } else {
            tx.innerHTML = JSON.stringify(info, "\t")
        }
    })
}

function getEstimateGas(from,to){
    if (client == undefined) {
        var ScdoClient = require('./src/api/scdoClient');
        client = new ScdoClient();
      }
    client.estimateGas(from, to, "",function(info,err){
        if (err) {
            alert(err)
        } else {
            document.getElementById("estimatedgas").innerText=info;
        }
    })
}

function detectShards(from, to) {
    if (client == undefined) {
        var ScdoClient = require('./src/api/scdoClient');
        client = new ScdoClient();
    }
    var shardFrom = client.getShardNum(from);
    var shardTo = client.getShardNum(to);
    if (shardFrom != shardTo) {
        const lang = document.getElementById("lang").value
        if(!MSGJSON){
             const fs = require('fs');
             MSGJSON = JSON.parse(fs.readFileSync(client.langPath.toString()).toString());
          }     
        var alertText = MSGJSON[lang]["shardWarning"]["1"]+ shardFrom 
        + MSGJSON[lang]["shardWarning"]["2"] + shardTo 
        + MSGJSON[lang]["shardWarning"]["3"];
        // alert(alertText);
        layer.alert(alertText);
    }
}
