 document.addEventListener( "DOMContentLoaded", function() {
  var make = Make({
    makeAPI: ""
  });

  var makeTitle = document.getElementById( "make-title" ),
      makeDescription = document.getElementById( "make-description" ),
      makeAuthor = document.getElementById( "make-author" ),
      makeBody = document.getElementById( "make-body" ),
      makeContentType = document.getElementById( "make-content-type" ),
      makeDifficulty = document.getElementById( "make-difficulty" ),
      makeLocale = document.getElementById( "make-locale" ),
      makeUrl = document.getElementById( "make-url" ),
      makeThumbnail = document.getElementById( "make-thumbnail" ),
      makeTags = document.getElementById( "make-tags" ),
      searchTags = document.getElementById( "tags" ),
      searchAuthor = document.getElementById( "author" ),
      size = document.getElementById( "size" ),
      makeTagPrefix = document.getElementById( "tag-prefix" ),
      makeId = document.getElementById( "make-id" ),
      sortBy = document.getElementById( "sort-field" ),
      makeResult = document.getElementById( "make-result" ),
      searchResult = document.getElementById( "search-result" );

  window.grabTags = function() {
    make.all
    .withTags( searchTags.value.split( "," ), document.querySelector( "input[name='execution']:checked" ).value )
    .sortByField( sortBy.value )
    .limit( size.value )
    .then(function( data ) {
      console.log(data);
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
  };

  window.myProjects = function() {
    make.all
    .withTags( searchTags.value.split( "," ), document.querySelector( "input[name='execution']:checked" ).value )
    .limit( size.value )
    .withAuthor( searchAuthor.value )
    .sortByField( sortBy.value )
    .then(function( data ) {
      console.log(data);
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
  };

  window.findProject = function() {
    make.one.withId( document.getElementById( "search-make-id" ).value, function( data ) {
      searchResult.value = JSON.stringify( data, null, 2 );
    });
  };

  window.prefixSearch = function() {
    make.all
    .withTagPrefix( makeTagPrefix.value )
    .limit( size.value )
    .sortByField( sortBy.value )
    .then(function( data ) {
      console.log( data );
      searchResult.value = JSON.stringify( data.hits, null, 2 );
    });
  };

  function getData() {
    return {
      title: makeTitle.value,
      description: makeDescription.value,
      author: makeAuthor.value,
      body: makeBody.value,
      contentType: makeContentType.value,
      difficulty: makeDifficulty.value,
      locale: makeLocale.value,
      url: makeUrl.value,
      thumbnail: makeThumbnail.value,
      tags: makeTags.value.split( "," )
    };
  }

  function handleResponse( resp ) {
    makeId.value = resp._id;
    makeResult.value = JSON.stringify( resp, null, 2 );
  }

  window.createMake = function() {
    make.create( getData(), handleResponse );
  };

  window.updateMake = function() {
    make.update( makeId.value, getData(), handleResponse )
  };

  window.deleteMake = function() {
    make.remove( makeId.value, handleResponse );
  }
}, false );
