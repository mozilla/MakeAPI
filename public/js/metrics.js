/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener( "DOMContentLoaded", function() {
  

function doMetrics( url ) {
  var _GLBajax;
  var createHTTPRequest = function (url) {
      var xmlobj;
  
      if ( window.XMLHttpRequest ) { // This will let use know if this is a NON-IE browser
        xmlobj = new XMLHttpRequest();
      } else if ( window.ActiveXObject ) { // This will let use know if it is an IE 8 or older browser
        xmlobj = new ActiveXObject( "Microsoft.XMLHTTP" );
      }
      if ( xmlobj != "undefined" ) {
           xmlobj._url= url;
           
        makeRequest(xmlobj, "GET", url);
        return true;
      }
    };

  var makeRequest = function ( xmlMessage, type, url ) {
      xmlMessage.open( type, url, true );
      xmlMessage.send();
      _GLBajax = xmlMessage;
      xmlMessage.onreadystatechange = requestHandler;
      return false;
    };

  var requestHandler = function () {
      if ( _GLBajax.readyState >= 4 && _GLBajax.status == 200 ) {
        var data = JSON.parse( _GLBajax.response );

        var url=this._url;
        var obj = {
          "endpoint": url,
          "count": data.count
        };
		var html= document.getElementById("metriclist").innerHTML;
		document.getElementById("metriclist").innerHTML=html+"<li> ENDPOINT: "+url+" COUNT: "+data.count+"</li>";
       return true;
      }
    };
  createHTTPRequest(url);
}


doMetrics( "/metrics/makes/all" );
doMetrics("/metrics/makes/day");
doMetrics("/metrics/makes/week");
doMetrics("/metrics/remix/all");
doMetrics("/metrics/remix/day");
doMetrics("/metrics/remix/week");

});

