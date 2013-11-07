/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener( "DOMContentLoaded", function() {
  var Slick = window.Slick;

  var webmakerHostName = document.querySelector( "meta[name='webmaker_hostname']" ).getAttribute( "content" );

  var FORMATTERS = {
    url: function( r, c, val, def, datactx ) {
      return '<a href="' + val + '" target="_blank">' + val + '</a>';
    }
  },

  COLUMNS = [
    {
      id: "endpoint",
      name: "endpoint",
      field: "endpoint",
      width: 150,
      sortable: true,
      formatter: FORMATTERS.url
    },
    {
      id: "count",
      name: "count",
      field: "count",
      width: 150,
      sortable: true
    } ];

  var csrfToken = document.querySelector( "meta[name=csrf_token]" ).getAttribute( "content" ),
      filter = document.getElementById( "filter" ),
      type = document.getElementById( "type" ),
      gridArea = document.querySelector( "#data-table-area" ),
      errorSpan = document.querySelector( "#error-message" ),
      dataView = new Slick.Data.DataView(),
      grid = new Slick.Grid( gridArea, dataView, COLUMNS, {
        autoEdit: false,
        editable: true,
        enableTextSelectionOnCells: true,
        topPanelHeight: 100
      });
  
function doMetrics( grid ) {
  var _GLBajax;
  var createHTTPRequest = function () {
      var xmlobj;
      if ( window.XMLHttpRequest ) { // This will let use know if this is a NON-IE browser
        xmlobj = new XMLHttpRequest();
      } else if ( window.ActiveXObject ) { // This will let use know if it is an IE 8 or older browser
        xmlobj = new ActiveXObject( "Microsoft.XMLHTTP" );
      }
      if ( xmlobj != "undefined" ) {
        makeRequest(xmlobj, "GET", "/metrics/" + type.value + "/" + filter.value);
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
        grid.invalidateAllRows();
        var obj = {
          "endpoint": "/metrics/" + type.value + "/" + filter.value,
          "count": data.count
        };
        grid.setData([obj]);
        grid.updateRowCount();
        grid.render();
        return true;
      }
    };
  createHTTPRequest();
}

doMetrics( grid );

type.addEventListener( "change", function () {
  doMetrics( grid );
}, false );

filter.addEventListener( "change", function () {
  doMetrics( grid );
}, false );

});
