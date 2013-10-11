/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

document.addEventListener( "DOMContentLoaded", function() {
  var Slick = window.Slick;

  var isAdmin = +document.querySelector( "meta[name='is_collaborator']" ).getAttribute( "content" ) === 0,
      webmakerHostName = document.querySelector( "meta[name='webmaker_hostname']" ).getAttribute( "content" );

  var FORMATTERS = {
    date: function( row, cell, val ) {
      var newDate;

      try {
        newDate = val ? new Date( val ) : "N/A";
      } catch( e ) {
        newDate = Date.now();
        errorSpan.removeClass( "hidden" ).html( "Bad Date Value. Falling back to current date and time." );
      }
      return newDate;
    },
    tags: function( row, cell, val ) {
      return Array.isArray( val ) ? val.join( "," ) : val;
    },
    username: function( row, cell, val ) {
      return '<a href="' + webmakerHostName + '/u/' + val + '" target="_blank">' + val + '</a>';
    },
    url: function( r, c, val, def, datactx ) {
      return '<a href="' + val + '" target="_blank">' + val + '</a>';
    },
    thumbnail: function( r, c, val, def, datactx ) {
      if ( !val ) {
        return "";
      }
      return '<a href="' + val + '" target="_blank">' + val + '</a>';
    },
    del: function ( r, c, val, def, datactx ) {
      return '<button onclick="removeClick(\'' + val + '\',\'' + datactx.id + '\');" class="delete-make-btn red-text">X</button>';
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


  var escapeMap = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;',
    "<": '&lt;',
    ">": '&gt;'
  },
  reverseEscapeMap = {
    '&amp;' : '&',
    '&quot;': '"',
    '&#39;' : "'",
    '&lt;'  : "<",
    '&gt;'  : ">"
  };

  function lookupChar( ch ) {
    return escapeMap[ ch ];
  }

  function lookupReverseChar( ch ) {
    return reverseEscapeMap[ ch ];
  }

  function escapeChars( str ) {
    if ( !str ) {
      return "";
    }
    return str.replace( /[&"'<>]/g, lookupChar );
  }

  function unescapeChars( str ) {
    if ( !str ) {
      return "";
    }
    return str.replace( /(&amp;|&quot;|&#39;|&lt;|&gt;)/g, lookupReverseChar );
  }

  function trimItems( items ) {
    return items.map( function( item ) {
      return item.trim();
    });
  }

  function sanitize( data ) {
    return data.map(function( make ){
      make.title = escapeChars( make.title );
      make.description = escapeChars( make.description );
      make.tags = make.tags.map(function( tag ) {
        return escapeChars( tag );
      });
      return make;
    });
  }

  var MakePager = function( settings ) {

    var STATUS_TEMPLATE = "Page {{pagenum}} of {{pagetotal}} - {{hits}} total hits",
        DEFAULT_PAGE_SIZE = 100;

    var goFirst = settings.goFirst,
        goPrevious = settings.goPrevious,
        goNext = settings.goNext,
        goLast = settings.goLast,
        goToInput = settings.goToInput,
        goToBtn = settings.goToBtn,
        navStatus = settings.navStatus,
        errorElem = settings.errorElement,
        loadingElem = settings.loadingElem,
        pageTotalToggles = settings.pageTotalToggles,
        currentQuery = {},
        resultsPerPage = DEFAULT_PAGE_SIZE,
        forEach = Array.prototype.forEach,
        currentPage = 1,
        totalPages = 1;

    function setQuery( type, query ) {
      currentQuery.type = type;
      currentQuery.query = query;
    }

    function handleMakes( err, data, total, page ) {
      if ( err || !data ) {
        errorElem.classList.remove( "hidden" );
        errorElem.textContent = "Error retrieving data: " + err;
      } else if ( !data.length  ) {
        if ( total ) {
          return goToPage( Math.ceil( total / resultsPerPage ) );
        }
        data = [];
        totalPages = 1;
        currentPage = 1;
        total = 0;
      } else {
        totalPages = Math.ceil( total / resultsPerPage );
        currentPage = page;
      }

      navStatus.textContent = STATUS_TEMPLATE
      .replace( "{{pagenum}}" , currentPage )
      .replace( "{{pagetotal}}", totalPages )
      .replace( "{{hits}}", total );

      dataView.beginUpdate();
      dataView.setItems( sanitize( data ) );
      dataView.endUpdate();
      grid.render();
    }

    function goToPage( num ) {

      if ( currentQuery.type && currentQuery.query ) {
        if ( currentQuery.type === "tags" ) {
          currentQuery.query = trimItems( currentQuery.query.split( "," ) );
        }
        make[ currentQuery.type ]( currentQuery.query );
      }

      loadingElem.classList.remove( "spin-hidden" );

      make.limit( resultsPerPage )
      .page( num )
      .sortByField( "createdAt", "desc" )
      .then(function( err, data, total ) {
        loadingElem.classList.add( "spin-hidden" );
        handleMakes( err, data, total, num );
      });
    }

    function setPage( num ) {
      num = num ? +num : 1;
      if ( num < 1 || num > totalPages ) {
        return;
      }
      goToPage( num );
    }

    function checkInputRange( val ) {
      if ( val <= 0 ) {
        goToInput.value = 1;
        return 1;
      } else if ( val > totalPages ) {
        goToInput.value = totalPages;
        return totalPages;
      }
      return val;
    }

    function validInput( val ) {
      if ( !val || isNaN( val ) ) {
        goToInput.classList.add( "invalid-input" );
        return false;
      }
      goToInput.classList.remove( "invalid-input" );
      return true;
    }

    goFirst.addEventListener( "click", function() {
      setPage( 1 );
    }, false );

    goPrevious.addEventListener( "click", function() {
      setPage( currentPage - 1 );
    }, false );

    goNext.addEventListener( "click", function() {
      setPage( currentPage + 1 );
    }, false );

    goLast.addEventListener( "click", function() {
      setPage( totalPages );
    }, false );

    goToInput.addEventListener( "keypress", function( e ) {
      var val;
      if ( e.which === 13 ) {
        e.preventDefault();
        e.stopPropagation();
        val = +goToInput.value;
        if ( !validInput( val ) ) {
          return;
        }
        setPage( checkInputRange( val ) );
      }
    }, false );

    goToBtn.addEventListener( "click", function() {
      var val = +goToInput.value;
      if ( !validInput( val ) ) {
        return;
      }
      setPage( checkInputRange( val ) );
    }, false );

    forEach.call( pageTotalToggles, function( elem ) {
      elem.addEventListener( "click", function() {
        if ( this.classList.contains( "selected" ) ) {
          return;
        }
        forEach.call( pageTotalToggles, function( elem ) {
          if ( this !== elem && elem.classList.contains( "selected" ) ) {
            elem.classList.remove( "selected" );
          }
        }, this );
        this.classList.add( "selected" );
        resultsPerPage = +elem.getAttribute( "data-value" );
        goToPage( currentPage );
      }, false );
    });

    this.goToPage = goToPage;
    this.setQuery = setQuery;

    return this;
  };

  var csrfToken = document.querySelector( "meta[name=csrf_token]" ).getAttribute( "content" ),
      make = new window.Make({
        apiURL: "/admin",
        csrf: csrfToken
      }),
      searchTypeSelector = document.querySelector( "#filter-type" ),
      //searchValue = document.querySelector( "#search-tag" ),
      filter = document.getElementById( "filter" ),
      type = document.getElementById( "type" ),
      //searchBtn = document.querySelector( "#search" ),
      gridArea = document.querySelector( "#data-table-area" ),
      identity = document.querySelector( "#identity" ).textContent,
      errorSpan = document.querySelector( "#error-message" ),
      dataView = new Slick.Data.DataView(),
      grid = new Slick.Grid( gridArea, dataView, COLUMNS, {
        autoEdit: false,
        editable: true,
        enableTextSelectionOnCells: true,
        topPanelHeight: 100
      }),
      pager = new MakePager({
        goFirst: document.querySelector( "#nav-first" ),
        goPrevious: document.querySelector( "#nav-previous"),
        goNext: document.querySelector( "#nav-next" ),
        goLast: document.querySelector( "#nav-last" ),
        goToInput: document.querySelector( "#nav-go-to-page"),
        goToBtn: document.querySelector( "#nav-go-to-page-btn"),
        navStatus: document.querySelector( "#nav-status" ),
        loadingElem: document.querySelector( "#nav-loading" ),
        pageTotalToggles: document.querySelectorAll( ".nav-page-total-setting" ),
        errorElement: errorSpan
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

window.removeClick = function( id, dataViewId ){
    make.remove( id, function( err ) {
      if ( err ) {
        errorSpan.removeClass( "hidden" ).html( "Error Deleting! " + JSON.stringify( err ) );
      }
      else {
        dataView.deleteItem( dataViewId );
        grid.invalidate();
        grid.render();
      }
    });
  };

  pager.setQuery();
  pager.goToPage( 1 );

  var contactEmail = document.querySelector( "#app-contact"),
      createUser = document.querySelector( "#add-user" ),
      createResult = document.querySelector( "#user-result" );

  function generateKeys() {
    var request = new XMLHttpRequest();

    request.open( "POST", "/admin/api/user", true );
    request.setRequestHeader( "x-csrf-token", csrfToken );
    request.setRequestHeader( "Content-Type", "application/json; charset=utf-8" );
    request.onreadystatechange = function() {
      var response,
          error;
      if ( this.readyState === 4 ) {
        try {
          response = JSON.parse( this.responseText ),
          error = response.error;
        }
        catch ( exception ) {
          error = exception;
        }
        if ( error ) {
          createResult.value = JSON.stringify( error, null, 2 );
        } else {
          createResult.value = JSON.stringify( response, null, 2 );
        }
      }
    };
    request.send(JSON.stringify({
      contact: contactEmail.value
    }));
  }

  navigator.idSSO.watch({
    onlogin: function() {},
    onlogout: function() {
      var request = new XMLHttpRequest();

      request.open( "POST", "/persona/logout", true );
      request.setRequestHeader( "x-csrf-token", csrfToken );
      request.addEventListener( "loadend", function() {
        window.location.replace( "./login" );
      }, false);
      request.send();
    }
  });
}, false );
