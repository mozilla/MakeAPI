/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Query Genenerators
 * This module contains generator functions for ElasticSearch Query DSL objects.
 * When creating base query objects for various types of Elastic Search queries,
 * add the generator functions here
 */

module.exports = {
  /*
   * The baseQuery return object should be used when there aren't
   * any additional filters to be applied to a query. For example,
   * a search for the 20 most recently created makes can be made using this query.
   * This is a filtered query: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html
   */
  baseQuery: function() {
    return {
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
      }
    };
  },

  /*
   * Use the advanced query when you need to generate more complex queries
   * that will need filters applied for different make fields.
   * The advancedQuery inherits the baseQuery as it's query for a
   * filtered query: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html
   */
  advancedQuery: function() {
    return {
      query: {
        filtered: {
          filter: {
            bool: {
              must: [],
              should: []
            }
          },
          query: this.baseQuery().query
        }
      }
    };
  }
};
