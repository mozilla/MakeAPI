module.exports = function( qb ) {
  var assert = require( "assert" ),
      baseQuery = {
        query: {
          filtered: {
            query: {
              match_all: {}
            },
            filter: {
              and: [
                {
                  missing: {
                    field: "deletedAt",
                    null_value: true
                  }
                },
                {
                  term: {
                    published: true
                  }
                }
              ]
            }
          }
        },
        size: 10,
        from: 0
      },
      validSortFields = [
        "author",
        "contentType",
        "description",
        "id",
        "remixedFrom",
        "title",
        "url",
        "createdAt",
        "updatedAt"
      ],
      validDirections = [
        "",
        ",asc",
        ",desc"
      ];

  return function() {
    qb.search( { sortByField: 1 }, function( err, query ) {
      it( "err should be null", function() {
        assert.strictEqual( err, null );
      });
      it( "query should be defined", function(){
        assert( query );
      });
      it( "The invalid sort field should have been ignored", function() {
        assert.deepEqual( query, baseQuery );
      });
    });

    qb.search( { sortByField: "Invalid" }, function( err, query ) {
      it( "err should be null", function() {
        assert.strictEqual( err, null );
      });
      it( "query should be defined", function(){
        assert( query );
      });
      it( "The invalid sort field should have been ignored", function() {
        assert.deepEqual( query, baseQuery );
      });
    });

    qb.search( { sortByField: { "invalid": "arg" } }, function( err, query ) {
      it( "err should be null", function() {
        assert.strictEqual( err, null );
      });
      it( "query should be defined", function(){
        assert( query );
      });
      it( "The invalid sort field should have been ignored", function() {
        assert.deepEqual( query, baseQuery );
      });
    });

    validSortFields.forEach(function( field ) {
      validDirections.forEach( function( direction ) {
        qb.search( { sortByField: direction ? field + direction : field }, function( err, query ) {
          it( "err should be null", function() {
            assert.strictEqual( err, null );
          });
          it( "query should be defined", function(){
            assert( query );
          });
          it( "The sort field should have been created for " + field, function() {
            var passObj = {};
            passObj[ field ] = direction ? direction.substr( 1 ) : "desc";
            assert.deepEqual( query.sort[0], passObj );
          });
        });
      });
    });
  };
};
