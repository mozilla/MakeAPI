/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 document.addEventListener( "DOMContentLoaded", function() {
  var make = Make({
    apiURL: "",
    auth: "testuser:password"
  });

  var makeTitle = document.getElementById( "make-title" ),
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
      sortBy = document.getElementById( "sort-field" ),
      makeResult = document.getElementById( "make-result" ),
      searchResult = document.getElementById( "search-result" );

  window.grabTags = function() {
    make
    .tags({
      tags: searchTags.value.split( "," ),
      execution: document.querySelector( "input[name='execution']:checked" ).value
    })
    .field( sortBy.value )
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
    make
    .tags({
      tags: searchTags.value.split( "," ),
      execution: document.querySelector( "input[name='execution']:checked" ).value
    })
    .limit( size.value )
    .page( page.value || 1 )
    .author( searchAuthor.value )
    .field( sortBy.value )
    .then(function( error, data ) {
      if ( error ) {
        searchResult.value = JSON.stringify( error, null, 2 );
        return;
      }
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
  };

  window.findProject = function() {
    make
    .find( { id: document.getElementById( "search-make-id" ).value } )
    .then(function( error, data ) {
      if ( error ) {
        searchResult.value = JSON.stringify( error, null, 2 );
        return;
      }
      searchResult.value = JSON.stringify( data, null, 2 );
    });
  };

  window.prefixSearch = function() {
    make
    .tagPrefix( makeTagPrefix.value )
    .limit( size.value )
    .page( page.value || 1 )
    .field( sortBy.value )
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
      title: makeTitle.value,
      description: makeDescription.value,
      author: makeAuthor.value,
      email: makeEmail.value,
      contentType: makeContentType.value,
      locale: makeLocale.value,
      url: makeUrl.value,
      thumbnail: makeThumbnail.value,
      tags: makeTags.value.split( "," )
    };
  }

  function handleResponse( error, resp ) {
    if ( error ) {
      makeResult.value = JSON.stringify( error, null, 2 );
      return;
    }
    makeId.value = resp._id;
    makeResult.value = JSON.stringify( resp, null, 2 );
  }

  window.createMake = function() {
    make.create( getData(), handleResponse );
  };

  window.updateMake = function() {
    make.update( makeId.value, getData(), handleResponse );
  };

  window.deleteMake = function() {
    make.remove( makeId.value, handleResponse );
  };
}, false );
