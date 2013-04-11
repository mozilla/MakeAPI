var Faker = require( "Faker" );

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

module.exports = function() {
  return {
    "title": Faker.Lorem.words( Faker.Helpers.randomNumber( 10 ) + 1 ),
    "email": Faker.Internet.email(),
    "contentType": Faker.Helpers.randomize( ["text/html", "application/butter" ] ),
    "body": Faker.Lorem.paragraph(),
    "difficulty": Faker.Helpers.randomize(["Beginner","Intermediate","Advanced"]),
    "locale": Faker.Helpers.randomize(["en_us","en_ca","en_gb"]),
    "updatedAt": randomDate(new Date(2011,1,1), new Date ).toString(),
    "url": "www.webmadecontent.org/" + Faker.random.number( 9999999999999 ),
    "remixedFrom": null,
    "tags": [
        Faker.Helpers.randomize( ["thimble.wm.org","popcorn.wm.org", Faker.Name.firstName()] ) +
        ":" + Faker.Helpers.randomize( ["project","featured","favourite"]),
        Faker.Helpers.randomize( ["thimble.wm.org","popcorn.wm.org", Faker.Name.firstName()] ) +
        ":" + Faker.Helpers.randomize( ["project","featured","favourite"])
    ],
    "author": Faker.Helpers.randomize([
        "matts@mozillafoundation.org", "kate@mozillafoundation.org", "jbuck@mozillafoundation.org",
        "scott@mozillafoundation.org", "surman@mozillafoundation.org", "pomax@mozillafoundation.org",
        Faker.Internet.email()
    ])
  };
};