# MakeAPI

## Usage:

```
jQuery.ajax({
        type: "POST",
        url: "/api/make",
        data: {
          url: "http://thimble.webmaker.org/p/fj6v",
          contentType: "text/html",
          locale: "en_us",
          title: "Soapbox - Let your voice be heard",
          body: "<h1>Make Your Own Rant Page</h1><p>blah blah blah, this is your pulpit.</p>",
          difficulty: 'Beginner',
          author: "simon@simonwex.com",
          contentAuthor: 'swex@mozilla.com',
          published: true
        },
        success: function(data, textStatus, jqXHR){
          console.log("Post resposne:"); 
          console.dir(data); 
          console.log(textStatus); 
          console.dir(jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown){
          console.log(jqXHR.responseText);
        }
      });
```