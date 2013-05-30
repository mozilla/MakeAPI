/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 document.addEventListener( "DOMContentLoaded", function() {

  var makeURL = document.getElementById( "makeURL" ),
      searchTags = document.getElementById( "tags" ),
      searchAuthor = document.getElementById( "author" ),
      size = document.getElementById( "size" ),
      page = document.getElementById( "page" ),
      makeTagPrefix = document.getElementById( "tag-prefix" ),
      idSearch = document.getElementById( "search-make-id" ),
      sortBy = document.getElementById( "sort-field" ),
      makerID = document.getElementById( "search-make-username" ),
      searchResult = document.getElementById( "search-result" );

  function make() {
    var url = makeURL.value || "";
    return Make({
      apiURL: url
    });
  }

  function processResult( error, data ) {
    if ( error ) {
      searchResult.value = JSON.stringify( error, null, 2 );
    } else {
      searchResult.value = JSON.stringify( data, null, 2 );
    }
  }

  window.searchTitle = function() {
    make()
    .title( document.getElementById( "title" ).value )
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .limit( size.value )
    .page( page.value || 1 )
    .then( processResult );
  };

  window.searchDescription = function() {
    make()
    .description( document.getElementById( "description" ).value )
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .limit( size.value )
    .page( page.value || 1 )
    .then( processResult );
  };

  window.grabTags = function() {
    make()
    .tags({
      tags: searchTags.value.split( "," ),
      execution: document.querySelector( "input[name='execution']:checked" ).value
    })
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .limit( size.value )
    .page( page.value || 1 )
    .then( processResult );
  };

  window.myProjects = function() {
    make()
    .tags({
      tags: searchTags.value.split( "," ),
      execution: document.querySelector( "input[name='execution']:checked" ).value
    })
    .limit( size.value )
    .page( page.value || 1 )
    .author( searchAuthor.value )
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .then( processResult );
  };

  window.findProject = function() {
    make()
    .find( { id: idSearch.value } )
    .then( processResult );
  };

  window.prefixSearch = function() {
    make()
    .tagPrefix( makeTagPrefix.value )
    .limit( size.value )
    .page( page.value || 1 )
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .then( processResult );
  };

  window.usernameSearch = function() {
    make()
    .user( makerID.value )
    .then( processResult );
  };

  function getData() {
    return {
      maker: webmakerID.value,
      make: {
        title: makeTitle.value,
        description: makeDescription.value,
        author: makeAuthor.value,
        email: makeEmail.value,
        contentType: makeContentType.value,
        locale: makeLocale.value,
        url: makeUrl.value,
        thumbnail: makeThumbnail.value,
        tags: makeTags.value.split( "," ),
        appTags: appTags.value.split( "," )
      }
    };
  }

  function handleResponse( error, resp ) {
    if ( error ) {
      makeResult.value = JSON.stringify( error, null, 2 );
      return;
    }
    try {
      makeId.value = resp._id;
      makeResult.value = JSON.stringify( resp, null, 2 );
    } catch( e ) {
      makeResult.value = e.toString();
    }
  }

}, false );
