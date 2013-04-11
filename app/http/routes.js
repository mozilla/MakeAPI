/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

routes = {
  site: require('./controllers/site'),
  api: {
    make: require('./controllers/api/make'),
    status: require('./controllers/api/status')
  }
};


module.exports = function(http){
  http.get('/', routes.site.index),

  http.get(   '/api',             routes.api.status.basic);

  http.post(  '/api/make',        routes.api.make.create);
  http.get(   '/api/makes',       routes.api.make.find);
  http.get(   '/api/makes/search', routes.api.make.search );
  http.get(   '/api/make/:id',    routes.api.make.findById);
  http.put(   '/api/make/:id',    routes.api.make.update);
  http.delete('/api/make/:id',    routes.api.make.delete);
}
