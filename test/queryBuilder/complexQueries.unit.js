module.exports = function( qb ) {
  var assert = require( "assert" );

  var tests = [
    {
      args: [{
        limit: 5,
        author: "name",
        user: "webmaker"
      }],
      filters: [
        {
          term: {
            author: "name"
          }
        }, {
          term: {
            email: "webmaker@mozillafoundation.org"
          }
        }
      ],
      attributes: [
        { attr: "size", value: 5 }
      ]
    },
    {
      args: [{
        limit: 10,
        page: 3,
        tags: "{!}or,tag,tag2,tag3",
        url: "https://mozilla.org"
      }],
      filters: [
        {
          not: {
            terms: {
              tags: [
                "tag",
                "tag2",
                "tag3"
              ],
              execution: "or"
            }
          }
        }, {
          term: {
            url: "https://mozilla.org"
          }
        }
      ],
      attributes: [
        { attr: "size", value: 10 },
        { attr: "from", value: 20 }
      ]
    },
    {
      args: [{
        limit: 5,
        title: "This is a title",
        tagPrefix: "foo"
      }],
      filters: [
        {
          query: {
            query_string: {
              query: "This is a title",
              fields: [
                "title"
              ],
              default_operator: "AND"
            }
          }
        }, {
          prefix: {
            tags: "foo"
          }
        }
      ],
      attributes: [
        { attr: "size", value: 5 }
      ]
    },
    {
      args: [{
        limit: 1,
        page: 20,
        id: "{!}randomid",
        contentType: "application/x-type"
      }],
      filters: [
        {
          not: {
            query: {
              field: {
                _id: "randomid"
              }
            }
          }
        }, {
          term: {
            contentType: "application/x-type"
          }
        }
      ],
      attributes: [
        { attr: "size", value: 1 },
        { attr: "from", value: 19 }
      ]
    }
  ];

  return function() {
    tests.forEach(function( test ) {
      test.args.push(function( err, query ) {
        it( "err should be undefined", function() {
          assert.strictEqual( err, null );
        });
        it( "query should be defined", function(){
          assert( query );
        });
        it( JSON.stringify( test.args ), function() {
          var filters = test.filters,
              attributes = test.attributes,
              i;
          for( i = 0, l = filters.length; i < l; i++ ) {
            assert.deepEqual( query.query.filtered.filter.bool.must[ i ], filters[ i ] );
          }
          if ( attributes ) {
            for( i = 0, l = attributes.length; i < l; i++ ) {
              assert.deepEqual( query[ attributes[ i ].attr ], attributes[ i ].value );
            }
          }
        });
      });
      qb.build.apply( this, test.args );
    });
  };
};
