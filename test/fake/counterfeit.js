var Faker = require( "Faker" ),
    IMG_CATEGORIES = [
        "abstract",
        "animals",
        "business",
        "cats",
        "city",
        "foodnight",
        "life",
        "fashion",
        "people",
        "nature",
        "sports",
        "technics",
        "transport"
    ];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function maybe( chance, fn ) {
  var n = ( Faker.random.number( chance ) );
  if ( n === 0 ) {
    fn();
  } else {
    return false;
  }
}

// Stable list of user emails
var users = [
  "matts@mozillafoundation.org", "kate@mozillafoundation.org", "jbuck@mozillafoundation.org",
  "scott@mozillafoundation.org", "surman@mozillafoundation.org", "pomax@mozillafoundation.org"
 ];

function createEmail() {
  return Faker.Helpers.randomize( users );
}

function createName() {
  return Faker.Name.findName();
}

function createFake() {
  var fakeData = {};

  fakeData.title = Faker.random.catch_phrase_adjective() + " " + Faker.random.bs_adjective() + " " + Faker.random.bs_noun();
  fakeData.author = createName();
  fakeData.description = Faker.Lorem.paragraph();
  fakeData.thumbnail = "http://www.lorempixel.com/640/350/" + Faker.Helpers.randomize( IMG_CATEGORIES ) + "/" + Faker.random.number( 10 );
  fakeData.contentType = Faker.Helpers.randomize( [ "application/x-butter", "application/x-thimble", "text/html" ] );
  fakeData.locale = Faker.Helpers.randomize(["en_us","en_ca","en_gb"]);
  fakeData.url = "http://www.webmaker.org/" + Faker.random.number( 99999999999 );
  fakeData.tags = [];
  fakeData.email = createEmail();

  // Type
  fakeData.tags.push( "makeType:" + Faker.Helpers.randomize( [ "thimble", "popcorn", "challenge", "event", "kit", "demo" ] ) );
  // Featured?
  maybe( 5, function() {
    fakeData.tags.push( "featured" );
  });
  maybe( 10, function() {
    fakeData.tags.push( "tutorial" );
  });
  return fakeData;
}

module.exports = {
  createFake: createFake,
  createEmail: createEmail,
  createName: createName,
  users: users
};
