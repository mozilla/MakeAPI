module.exports = function( qb ){
  var assert = require( "assert" ),

  expectedObj = {
    term: {
      email: "webmaker@mozillafoundation.org"
    }
  },

  expectedNegatedObj = {
    not: expectedObj
  },

  fourOhFours = [
    "fakemaker",
    "fakemaker@mozillafoundation.org"
  ],

  userData = [
    {
      user: "webmaker",
      expected: expectedObj
    }, {
      user: "webmaker@mozillafoundation.org",
      expected: expectedObj
    }, {
      user: "{!}webmaker",
      expected: expectedNegatedObj
    }, {
      user: "{!}webmaker@mozillafoundation.org",
      expected: expectedNegatedObj
    }
  ];

  return function() {
    // normally would 404, but I fake a server error here.
    qb.search( { user: "nonsense" }, function( err, query ) {
      it( "err should be defined", function() {
        assert( err );
        assert.strictEqual( err.code, 500 );
        assert.strictEqual( err.error, "error" );
      });
      it( "query should be undefined", function(){
        assert.strictEqual( query, undefined );
      });
    });

    fourOhFours.forEach(function( user ) {
      qb.search( { user: user }, function( err, query ) {
        it( "err should be defined", function() {
          assert( err );
          assert.strictEqual( err.code, 404 );
        });
        it( "query should be undefined", function(){
          assert.strictEqual( query, undefined );
        });
      });
    });

    userData.forEach(function( test ) {
      qb.search( { user: test.user }, function( err, query ) {
        it( "err should be undefined", function() {
          assert.strictEqual( err, null );
        });
        it( "query should be defined", function(){
          assert( query );
        });
        it( "user filter should exist", function() {
          assert.deepEqual( query.query.filtered.filter.bool.must[ 0 ], test.expected );
        });
      });
    });
  };
};
