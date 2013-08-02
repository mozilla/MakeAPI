/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$(function() {

  var Slick = window.Slick;

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
    }
  },

  COLUMNS = [
    {
      id: "id",
      name: "Click To Delete",
      headerCssClass: "red-text",
      field: "id",
      minWidth: 150,
      formatter: function ( r, c, val, def, datactx ) {
        return '<button onclick="removeClick(\'' + val + '\',\'' + datactx.id + '\');" class="delete-make-btn red-text">Delete</button>';
      }
    },
    { id: "url", name: "Url", field: "url",
      editor: Slick.Editors.Text,
      sortable: true,
      formatter: function( r, c, val, def, datactx ) {
        return '<a href="' + val + '" target="_blank">' + val + '</a>';
      }
    },
    { id: "contentType", name: "Content Type", field: "contentType",
      editor: Slick.Editors.Text,
      sortable: true
    },
    { id: "locale", name: "Locale", field: "locale",
      editor: Slick.Editors.Text,
      sortable: true
    },
    { id: "title", name: "Title", field: "title",
      editor: Slick.Editors.Text,
      sortable: true
    },
    { id: "description", name: "Description", field: "description",
      editor: Slick.Editors.Text,
      sortable: true
    },
    { id: "thumbnail", name: "Thumbnail Url", field: "thumbnail",
      editor: Slick.Editors.Text,
      sortable: true,
      formatter: function( r, c, val, def, datactx ) {
        if ( !val ) {
          return "";
        }
        return '<a href="' + val + '" target="_blank">' + val + '</a>';
      }
    },
    { id: "username", name: "username", field: "username",
      sortable: true },
    { id: "tags", name: "Tags", field: "tags",
      formatter: FORMATTERS.tags,
      editor: Slick.Editors.Text
    },
    { id: "remixedFrom", name: "Remixed From", field: "remixedFrom",
      sortable: true },
    { id: "createdAt", name: "Created At", field: "createdAt",
      formatter: FORMATTERS.date,
      editor: Slick.Editors.Date,
      sortable: true
    },
    { id: "updatedAt", name: "Updated At", field: "updatedAt",
      formatter: FORMATTERS.date,
      editor: Slick.Editors.Date,
      sortable: true
    }
  ];

  var MakePager = function( settings ) {

    var STATUS_TEMPLATE = "Page {{pagenum}} of {{pagetotal}} - {{hits}} total hits",
        PAGE_SIZE = 100;

    var goFirst = settings.goFirst,
        goPrevious = settings.goPrevious,
        goNext = settings.goNext,
        goLast = settings.goLast,
        goToInput = settings.goToInput,
        goToBtn = settings.goToBtn,
        navStatus = settings.navStatus,
        errorElem = settings.errorElement,
        currentQuery = {},
        currentPage = 1,
        totalPages = 1;

    function trimItems( items ) {
      return items.map( function( item ) {
        return item.trim();
      });
    }

    function setQuery( type, query ) {
      currentQuery.type = type;
      currentQuery.query = query;
    }

    function handleMakes( err, data, total, page ) {
      if ( err || !data ) {
        errorElem.classList.remove( "hidden" );
        errorElem.textContent = "Error retrieving data: " + err;
      } else if ( !data.length  ) {
        data = [];
        totalPages = 1;
        currentPage = 1;
        total = 0;
      } else {
        totalPages = Math.ceil( total / PAGE_SIZE );
        currentPage = page;
      }

      navStatus.textContent = STATUS_TEMPLATE
      .replace( "{{pagenum}}" , currentPage )
      .replace( "{{pagetotal}}", totalPages )
      .replace( "{{hits}}", total );

      dataView.beginUpdate();
      dataView.setItems( data );
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

      make.limit( PAGE_SIZE )
      .page( num )
      .sortByField( "createdAt", "desc" )
      .then(function( err, data, total ) {
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

    this.goToPage = goToPage;
    this.setQuery = setQuery;

    return this;
  };

  var csrfToken = $("meta[name=csrf_token]").attr("content"),
      make = window.Make({
        apiURL: "/admin",
        csrf: csrfToken
      }),
      searchTypeSelector = $( "#filter-type" ),
      searchValue = $( "#search-tag" ),
      searchBtn = $( "#search" ),
      gridArea = $( ".data-table-area" ),
      identity = $( "#identity" ).text(),
      errorSpan = $( ".error-message" ),
      dataView = new Slick.Data.DataView(),
      grid = new Slick.Grid( gridArea, dataView, COLUMNS, {
        autoEdit: false,
        editable: true,
        enableTextSelectionOnCells: true,
        defaultColumnWidth: 150,
        topPanelHeight: 200
      }),
      pager = new MakePager({
        goFirst: document.querySelector( "#nav-first" ),
        goPrevious: document.querySelector( "#nav-previous"),
        goNext: document.querySelector( "#nav-next" ),
        goLast: document.querySelector( "#nav-last" ),
        goToInput: document.querySelector( "#nav-go-to-page"),
        goToBtn: document.querySelector( "#nav-go-to-page-btn"),
        navStatus: document.querySelector( "#nav-status" ),
        errorElement: errorSpan
      });

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

  grid.onCellChange.subscribe(function ( e, data ) {
    var make = data.item;
    make.tags = Array.isArray( make.tags ) ? make.tags : trimItems( make.tags.split( "," ) );
    make.update( identity, function( err, updated ) {
      if ( err ) {
        errorSpan.removeClass( "hidden" ).html( "Error Updating! " + JSON.stringify( err ) );
        return;
      }
      dataView.updateItem( data.item.id, make );
    });
  });

  dataView.onRowCountChanged.subscribe(function () {
    grid.updateRowCount();
    grid.render();
  });

  dataView.onRowsChanged.subscribe(function ( e, data ) {
    grid.invalidateRows( data.rows );
    grid.render();
  });

  grid.onSort.subscribe(function( e, data ) {
    dataView.fastSort( data.sortCol.field, data.sortAsc );
  });

  function doSearch() {
    pager.setQuery( searchTypeSelector.val(), searchValue.val() );
    errorSpan.addClass( "hidden" ).html( "" );
    pager.goToPage( 1 );
  }

  searchBtn.click( doSearch );

  // Press enter to search
  searchValue.keypress(function( e ) {
    if ( e.which === 13 ) {
      e.preventDefault();
      e.stopPropagation();
      doSearch();
      searchValue.blur();
    }
  });

  // On initial load, Query for all makes.
  pager.setQuery();
  pager.goToPage( 1 );

  // SSO
  var logout = $( "#logout" );

  logout.click(function(){
    navigator.idSSO.logout();
  });

  // User Keys
  var contactEmail = $( "#app-contact"),
      createUser = $( "#add-user" ),
      createResult = $( "#user-result" );

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
          createResult.val( JSON.stringify( error, null, 2 ) );
        } else {
          createResult.val( JSON.stringify( response, null, 2 ) );
        }
      }
    };
    request.send(JSON.stringify({
      contact: contactEmail.val()
    }));
  }

  createUser.keypress(function( e ) {
    if ( e.which === 13 ) {
      e.preventDefault();
      e.stopPropagation();
      generateKeys();
    }
  });

  createUser.click( generateKeys );

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
});
