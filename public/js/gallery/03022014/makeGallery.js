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
    make.rawTags.forEach(function(tag) {
      container.appendChild( makeElem( "a", "make-tag" ) );
    });
    return container;
  }


  function generateNode(make,clientConfig) {

    var node = document.querySelector(".make-node:first-child").cloneNode("true");
    var hidden = clientConfig.hidden || [];

    //Thumbnail Image
    var thumb = node.querySelector(".make-thumbnail");
    if(hidden.indexOf("thumbnail") < 0) {
      var thumbLink = node.querySelector(".make-link");
      thumbLink.setAttribute("href", make.url);
      if(make.thumbnail) {
        thumb.style.backgroundImage = "url(" + make.thumbnail + ")";
      } else {
        thumb.style.backgroundImage = "url(/images/chef.png)";
      }
    } else {
      thumb.parentNode.removeChild(thumb);
    }

    //Title link
    var link = node.querySelector("h1 a");
    if(hidden.indexOf("title") <0 ) {
      link.setAttribute("href",make.url)
      link.innerHTML  = make.title;
    } else {
      link.parentNode.removeChild(link);
    }

    var user = node.querySelector(".make-details-user");
    if(hidden.indexOf("user") < 0){
      user.innerHTML =  make.username;
    } else {
      user.parentNode.removeChild(user);
    }

    //Created At
    var createdAt = node.querySelector(".make-details-timestamp");
    if(hidden.indexOf("created-at") < 0){
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

    } else {
      createdAt.parentNode.removeChild(createdAt);
    }

    //Descripiton
    var description = node.querySelector(".make-description");
    if(hidden.indexOf("description") < 0){
      description.innerHTML = make.description;
    } else {
      description.parentNode.removeChild(description);
    }

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
    if(hidden.indexOf("remix-button") < 0){
      remix.setAttribute("href",make.remixurl);
    } else {
      remix.parentNode.removeChild(remix);
    }

    //Remix Button
    var like = node.querySelector(".make-like");
    if(hidden.indexOf("like-button") < 0){

    } else {
      like.parentNode.removeChild(like);
    }


    var avatar = node.querySelector(".make-user-avatar");
    if(hidden.indexOf("author-picture") < 0){
      var avatarSrc = "http://www.gravatar.com/avatar/" + make.emailHash + "?s=44&d=http%3A%2F%2Fwww.gravatar.com%2Fuserimage%2F4746804%2Fc340ce541cf962e553df23e779b4d1a8.jpg%3Fsize%3D44";
      avatar.setAttribute("src", avatarSrc);
    } else {
      avatar.parentNode.removeChild(avatar);
    }

    //Generate tags
    var makeTags = node.querySelector(".make-tags");
    if(hidden.indexOf("tags") < 0) {
      for(var i = 0; i < make.tags.length; i++){
        var tag = document.createElement("a");
        tag.classList.add("make-tag");
        tag.innerHTML = make.tags[i];
        tag.setAttribute("href","#");
        makeTags.appendChild(tag);
        makeTags.innerHTML = makeTags.innerHTML + " ";
      }
    } else {
      makeTags.parentNode.removeChild(makeTags);
    }


    return node;
  }

  function build( rootElement, makes,clientConfig) {
    makes.forEach(function(make) {
      rootElement.appendChild(generateNode(make,clientConfig));
    });
    fixHeights(rootElement)
  }

  function fixHeights(rootElement){

    var makeEls = rootElement.querySelectorAll(".make-node");
    var tallest = 0;
    for(var i = 0; i < makeEls.length; i++){
      if(makeEls[i].offsetHeight > tallest){
        tallest = makeEls[i].offsetHeight;
      }
    }

    for(var i = 0; i < makeEls.length; i++){
        makeEls[i].style.height = tallest + "px";
    }

  }

  function MakeGallery(query, element, clientConfig) {

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
        build( self.element, makes, clientConfig );
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
