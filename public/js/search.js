/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 document.addEventListener( "DOMContentLoaded", function() {

  var makeURL = document.getElementById( "makeURL" ),
      username = document.getElementById( "username" ),
      password = document.getElementById( "password" ),
      makeTitle = document.getElementById( "make-title" ),
      makeDescription = document.getElementById( "make-description" ),
      makeAuthor = document.getElementById( "make-author" ),
      makeEmail = document.getElementById( "make-email" ),
      makeContentType = document.getElementById( "make-content-type" ),
      makeLocale = document.getElementById( "make-locale" ),
      makeUrl = document.getElementById( "make-url" ),
      makeThumbnail = document.getElementById( "make-thumbnail" ),
      makeTags = document.getElementById( "make-tags" ),
      searchTags = document.getElementById( "tags" ),
      searchAuthor = document.getElementById( "author" ),
      size = document.getElementById( "size" ),
      page = document.getElementById( "page" ),
      makeTagPrefix = document.getElementById( "tag-prefix" ),
      makeId = document.getElementById( "make-id" ),
      idSearch = document.getElementById( "search-make-id" ),
      sortBy = document.getElementById( "sort-field" ),
      webmakerID = document.getElementById( "webmaker-id" ),
      makeResult = document.getElementById( "make-result" ),
      searchResult = document.getElementById( "search-result" ),
      appTags = document.getElementById( "app-tags" );

  function make() {
    var url = makeURL.value || "";
    return Make({
      apiURL: url,
      auth: username.value + ":" + password.value
    });
  }

  window.grabTags = function() {
    make()
    .tags({
      tags: searchTags.value.split( "," ),
      execution: document.querySelector( "input[name='execution']:checked" ).value
    })
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .limit( size.value )
    .page( page.value || 1 )
    .then(function( error, data ) {
      if ( error ) {
        searchResult.value = JSON.stringify( error, null, 2 );
        return;
      }
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
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
    .then(function( error, data ) {
      if ( error ) {
        searchResult.value = JSON.stringify( error, null, 2 );
        return;
      }
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
  };

  window.findProject = function() {
    make()
    .find( { id: idSearch.value } )
    .then(function( error, data ) {
      if ( error ) {
        searchResult.value = JSON.stringify( error, null, 2 );
        return;
      }
      searchResult.value = JSON.stringify( data, null, 2 );
    });
  };

  window.prefixSearch = function() {
    make()
    .tagPrefix( makeTagPrefix.value )
    .limit( size.value )
    .page( page.value || 1 )
    .sortByField( sortBy.value, document.querySelector( "input[name='direction']:checked" ).value )
    .then(function( error, data ) {
      if ( error ) {
        searchResult.value = JSON.stringify( error, null, 2 );
        return;
      }
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
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

  window.createMake = function() {
    make()
    .create( getData(), handleResponse );
  };

  window.updateMake = function() {
    make()
    .update( makeId.value, getData(), handleResponse );
  };

  window.deleteMake = function() {
    make()
    .remove( makeId.value, handleResponse );
  };
}, false );
