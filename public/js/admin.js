/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$(function() {

  var Slick = window.Slick,

      formatters = {
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
      };

  var COLUMNS = [
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
        return '<a href="#" onclick="previewUrl( \'' + val + '\' );">' + val + '</a>';
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
      sortable: true
    },
    { id: "username", name: "username", field: "username",
      sortable: true },
    { id: "tags", name: "Tags", field: "tags",
      formatter: formatters.tags,
      editor: Slick.Editors.Text
    },
    { id: "remixedFrom", name: "Remixed From", field: "remixedFrom",
      sortable: true },
    { id: "createdAt", name: "Created At", field: "createdAt",
      formatter: formatters.date,
      editor: Slick.Editors.Date,
      sortable: true
    },
    { id: "updatedAt", name: "Updated At", field: "updatedAt",
      formatter: formatters.date,
      editor: Slick.Editors.Date,
      sortable: true
    }
  ];

  // max hits that ES should return on a search.
  var MAX_SIZE = 50000;

  var options = {
        autoEdit: false,
        editable: true,
        enableTextSelectionOnCells: true,
        defaultColumnWidth: 150,
        topPanelHeight: 200
      },
      make = window.Make({
        apiURL: "/admin"
      }),
      tagSearchInput = $( "#search-tag" ),
      searchBtn = $( "#search" ),
      gridArea = $( ".data-table-area" ),
      identity = $( "#identity" ).text(),
      errorSpan = $( ".error-message" ),
      dataView = new Slick.Data.DataView(),
      grid = new Slick.Grid( gridArea, dataView, COLUMNS, options ),
      pager = new Slick.Controls.Pager( dataView, grid, $( "#pager" ) ),
      data;

  dataView.setPagingOptions( { pageSize: 25 } );

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

  window.previewUrl = function( url ) {
    $( '<iframe src="' + url + '" style="height: 80%; width: 80%;"></iframe>' )
    .lightbox_me({
      centered: true,
      destroyOnClose: true
    });
  };

  grid.onCellChange.subscribe(function ( e, data ) {
    var make = data.item;

    make.tags = Array.isArray( make.tags )? make.tags : make.tags.split( "," );

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

  function createGrid( err, data ) {
    if ( err ) {
      errorSpan.removeClass( "hidden" ).html( "Error retrieving data: " + err );
      return;
    }
    dataView.beginUpdate();
    dataView.setItems( data );
    dataView.endUpdate();
    grid.render();
  }

  function doSearch() {
    errorSpan.addClass( "hidden" ).html( "" );
    if ( tagSearchInput.val() ) {
      make.tags( tagSearchInput.val().split( "," ) );
    }
    make.limit( MAX_SIZE )
    .then( createGrid );
  }

  searchBtn.click( doSearch );

  // Press enter to search
  tagSearchInput.keypress(function( e ) {
    if ( e.which === 13 ) {
      e.preventDefault();
      e.stopPropagation();
      doSearch();
      tagSearchInput.blur();
    }
  });

  // On initial load, Query for all makes.
  make.limit( MAX_SIZE ).then( createGrid );

  // SSO
  var logout = $( "#logout" );

  logout.click(function(){
    navigator.idSSO.logout();
  });

  navigator.idSSO.watch({
    onlogin: function() {},
    onlogout: function() {
      var request = new XMLHttpRequest();

      request.open( "POST", "/persona/logout", true );
      request.addEventListener( "loadend", function() {
        window.location.replace( "./login" );
      }, false);
      request.send();
    }
  });
});
