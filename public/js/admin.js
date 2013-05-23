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
            // Alert User to Error? - need error infrastructure
          }
          return newDate;
        },
        tags: function( row, cell, val ) {
          return Array.isArray( val ) ? val.join( "," ) : val;
        }
      };

  var COLUMNS = [
    { id: "url", name: "Url", field: "url",
      editor: Slick.Editors.Text
    },
    { id: "contentType", name: "Content Type", field: "contentType",
      editor: Slick.Editors.Text
    },
    { id: "locale", name: "Locale", field: "locale",
      editor: Slick.Editors.Text
    },
    { id: "title", name: "Title", field: "title",
      editor: Slick.Editors.Text
    },
    { id: "description", name: "Description", field: "description",
      editor: Slick.Editors.Text
    },
    { id: "thumbnail", name: "Thumbnail Url", field: "thumbnail",
      editor: Slick.Editors.Text
    },
    { id: "author", name: "Author", field: "author" },
    { id: "tags", name: "Tags", field: "tags",
      formatter: formatters.tags,
      editor: Slick.Editors.Text
    },
    { id: "remixedFrom", name: "Remixed From", field: "remixedFrom" },
    { id: "createdAt", name: "Created At", field: "createdAt",
      formatter: formatters.date,
      editor: Slick.Editors.Date
    },
    { id: "updatedAt", name: "Updated At", field: "updatedAt",
      formatter: formatters.date,
      editor: Slick.Editors.Date
    },
    { id: "deletedAt", name: "Deleted At", field: "deletedAt",
      formatter: formatters.date,
      editor: Slick.Editors.Date
    }
  ];

  var options = {
        autoEdit: false,
        editable: true,
        autoHeight: true,
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
      grid,
      data;

  function updateMake( e, data ) {
    var make = data.item;

    make.tags = Array.isArray( make.tags )? make.tags : make.tags.split( "," );
    make.email = identity;

    make.update( identity, function( err, data ) {
      if ( err ) {
        console.log( err );
        return;
      }
      // Better Success/Failure notification
    });
  }

  function createGrid( err, data ) {
    if ( err ) {
      console.log( err );
      // need better error handling
      return;
    }
    grid = new Slick.Grid( gridArea, data, COLUMNS, options );
    grid.onCellChange.subscribe( updateMake );
  }

  function doSearch() {
    make
    .tags( tagSearchInput.val().split( "," ) )
    .then( createGrid );
  }

  searchBtn.click( doSearch );
  tagSearchInput.keypress(function( e ) {
    if ( e.which === 13 ) {
      e.preventDefault();
      e.stopPropagation();
      doSearch();
      tagSearchInput.blur();
    }
  });

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
