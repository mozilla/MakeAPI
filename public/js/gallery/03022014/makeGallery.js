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

    console.log(make);

    var details = makeElem( "div", "make-details" );


    // var createdAt = makeElem( "div", "make-details-link");
    // createdAt.innerHTML = "Created " + make.createdAt;

    // var link = makeElem( "a", "make-details-link");
    // link.setAttribute("href",make.url);
    // link.innerHTML = make.title;



    console.log(user);

    //
    // var remix = makeElem( "a", "make-remix");
    // remix.setAttribute("href", make.remixUrl || make.url);
    // remix.innerHTML = "REMIX";
    //
    // tags = makeTags(make);

    // details.appendChild(link);
    // details.appendChild(createdAt);
    // details.appendChild(user);
    // details.appendChild(tags);
    // details.appendChild(remix);
    return details;
  }

  function generateNode(make) {


    var node = document.querySelector(".make-node:first-child").cloneNode("true");

    var thumbLink = node.querySelector(".make-link");
    thumbLink.setAttribute("href",make.url);

    var thumb = node.querySelector(".make-thumbnail");
    thumb.style.backgroundImage = "url(" + make.thumbnail + ")";


    var link = node.querySelector("h1 a");
    link.setAttribute("href",make.url)
    link.innerHTML  = make.title;

    var user = node.querySelector(".make-details-user");
    user.innerHTML =  make.username;

    //Timestamp
    var createdAt = node.querySelector(".make-details-timestamp");
    var createdTime = new Date(make.createdAt);
    var currentTime = new Date().getTime();
    var timeDelta = currentTime - createdTime;
    var day = 1000* 60 * 60 * 24;

    var days = Math.floor(timeDelta/day);
    var months = Math.floor(days/31);
    var years = Math.floor(months/12);

    var dateString;

    if(days > 50) {
      if(months > 12) {
        dateString = years + " years";
      } else {
        dateString = months + " months";
      }
    } else {
      dateString = days + " days";
    }
    createdAt.innerHTML = dateString;

    //Descripiton
    var description = node.querySelector(".make-description");
    description.innerHTML =  make.description;

    //Like count
    var likesWrapper = node.querySelector(".make-likes");
    var likeCount = node.querySelector(".make-likes-count");
    likeCount.innerHTML = make.likes.length;
    if(make.likes.length == 0) {
      likesWrapper.style.display = "none";
    }
    if(make.likes.length > 2) {
      likesWrapper.innerHTML = likesWrapper.innerHTML + "s";
    }

    //Remix Button
    var remix = node.querySelector(".make-remix");
    remix.setAttribute("href",make.remixurl);


    //Generate tags
    var makeTags = node.querySelector(".make-tags");
    for(var i = 0; i < make.tags.length; i++){
      console.log(make.tags[i]);
      var tag = document.createElement("a");
      tag.classList.add("make-tag");
      tag.innerHTML = make.tags[i];
      makeTags.appendChild(tag);
    }

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
