module.exports = function( qb ) {
  var assert = require( "assert" ),
      baseQuery = {
        query: {
          filtered: {
            query: {
              match_all: {}
            },
            filter: {
              missing: {
                field: "deletedAt",
                null_value: true
              }
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
    qb.build( { sortByField: 1 }, function( err, query ) {
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

    qb.build( { sortByField: "Invalid" }, function( err, query ) {
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

    qb.build( { sortByField: { "invalid": "arg" } }, function( err, query ) {
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
        qb.build( { sortByField: direction ? field + direction : field }, function( err, query ) {
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
