(function() {

  var DEFAULT_LIMIT = 10;

  var MakeAPI = window.Make;

  function makeElem( type, className, attributes ) {
    var elem = document.createElement( type );
    elem.className = className;
    if ( attributes ) {
      Object.keys( attributes ).forEach(function( attrName ) {
        elem.setAttribute( attrName, attributes[ attrName ] );
      });
    }
    return elem;
  }

  function makeTags( make ) {
    var container = makeElem( "div", "make-tag-container" );
    make.rawTags.forEach(function( tag ) {
      container.appendChild( makeElem( "a", "make-tag" ) );
    });
    return container;
  }

  function makeDetails( make ) {
    var details = makeElem( "div", "make-details" ),
      link = makeElem( "a", "make-details-link", {
        href: make.url
      }),
      user = makeElem( "div", "make-details-user", {
        textContent: make.username
      }),
      remix = makeElem( "a", "make-remix", {
        href: make.remixUrl || make.url
      }),
      tags = makeTags( make );

    details.appendChild( link );
    details.appendChild( user );
    details.appendChild( tags );
    details.appendChild( remix );
    return details;
  }

  function generateNode(make) {
    var node = makeElem( "div", "make-node" ),
      link = makeElem( "a", "make-link", {
        href: make.url
      }),
      thumb = makeElem( "div", "make-thumbnail", {
        style: make.thumbnail ? "background-image: url(" +  make.thumbnail + ");" : ""
      }),
      details = makeDetails( make );

    node.appendChild( link );
    node.appendChild( thumb );
    node.appendChild( details );

    return node;
  }

  function build( rootElement, makes ) {
    makes.forEach(function( make ) {
      rootElement.appendChild( generateNode( make ) );
    });
  }

  function MakeGallery( query, element, clientConfig ) {

    var self = this;

    this.element = typeof element === "string" ? document.querySelector( element ) : element;

    if ( !element ) {
      throw new Error( "you must provide an element or selector for the gallery" );
    }

    if ( !clientConfig ) {
      throw new Error( "you must provide a MakeAPI client Configuration object" );
    }

    var makeClient = new MakeAPI( clientConfig );

    query.limit = query.limit ? query.limit : DEFAULT_LIMIT;
    makeClient.find( query ).then(function( err, makes, count ) {
      if ( err ) {
        throw err;
      }

      if ( count ) {
        build( self.element, makes );
      } else {
        // what do we do for no makes?
      }
    });

    return this;
  }

  // Depending on the environment we need to export our "Make" object differently.
  if ( typeof define === "function" && define.amd ) {
    // Support for requirejs
    define(function() {
      return MakeGallery;
    });
  } else {
    window.MakeGallery = MakeGallery;
  }

})();
