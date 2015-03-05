/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global $ */

document.addEventListener("DOMContentLoaded", function () {
  var Slick = window.Slick;

  var isAdmin = +document.querySelector("meta[name='is_collaborator']").getAttribute("content") === 0,
    webmakerHostName = document.querySelector("meta[name='webmaker_hostname']").getAttribute("content");

  var FORMATTERS = {
      date: function (row, cell, val) {
        var newDate;

        try {
          newDate = val ? new Date(val) : "N/A";
        } catch (e) {
          newDate = Date.now();
          document.querySelector("#error-message")
            .classList.remove("hidden")
            .textContent("Bad Date Value. Falling back to current date and time.");
        }
        return newDate;
      },
      tags: function (row, cell, val) {
        return Array.isArray(val) ? val.join(",") : val;
      },
      username: function (row, cell, val) {
        return "<a href=\"" + webmakerHostName + "/u/" + val + "\" target=\"_blank\">" + val + "</a>";
      },
      url: function (r, c, val, def, datactx) {
        return "<a href=\"" + val + "/remix\" target=\"_blank\">Remix</a>";
      },
      thumbnail: function (r, c, val, def, datactx) {
        if (!val) {
          return "";
        }
        return "<a href=\"" + val + "\" target=\"_blank\">" + val + "</a>";
      },
      del: function (r, c, val, def, datactx) {
        return "<button onclick=\"removeClick('" +
          val +
          "','" +
          datactx.id +
          "');\" class=\"delete-make-btn red-text\">X</button>";
      },
      title: function (r, c, val, def, datactx) {
        return "<a href=\"" + datactx.url + "\" target=\"_blank\">" + val + "</a>";
      },
      reports: function (row, cell, val) {
        return val ? val.length : 0;
      },
      clearReports: function (row, cell, val, def, datactx) {
        return "<button onclick=\"clearReports('" +
          datactx.id +
          "');\" class=\"delete-reports-btn red-text\">Clear</button>";
      },
      id: function (r, c, val) {
        return "<span title=\"Click to set as remix count ID\" class=\"make-id\" onclick=\"updateRemixId('" +
          val +
          "');\">" +
          val +
          "<span>";
      }
    },

    COLUMNS = [{
      id: "url",
      name: "Remix Link",
      field: "url",
      width: 150,
      sortable: true,
      formatter: FORMATTERS.url
    }, {
      id: "title",
      name: "Title & Link",
      field: "title",
      width: 150,
      sortable: true,
      formatter: FORMATTERS.title
    }, {
      id: "description",
      name: "Description",
      field: "description",
      width: 150,
      sortable: true
    }, {
      id: "thumbnail",
      name: "Thumbnail Url",
      field: "thumbnail",
      width: 150,
      sortable: true,
      formatter: FORMATTERS.thumbnail
    }, {
      id: "username",
      name: "Username",
      field: "username",
      width: 150,
      sortable: true,
      formatter: FORMATTERS.username
    }, {
      id: "tags",
      name: "Tags",
      field: "tags",
      formatter: FORMATTERS.tags,
      width: 150,
      editor: Slick.Editors.Text,
      sortable: true
    }, {
      id: "createdAt",
      name: "Created At",
      field: "createdAt",
      formatter: FORMATTERS.date,
      width: 150,
      sortable: true
    }, {
      id: "updatedAt",
      name: "Updated At",
      field: "updatedAt",
      formatter: FORMATTERS.date,
      width: 150,
      sortable: true
    }, {
      id: "id",
      name: "ID",
      field: "id",
      width: 275,
      formatter: FORMATTERS.id
    }],

    ADMIN_COLS = [{
      id: "id",
      name: "Del",
      cssClass: "delete-col",
      headerCssClass: "red-text",
      field: "id",
      maxWidth: 40,
      minWidth: 40,
      width: 40,
      formatter: FORMATTERS.del
    }, {
      id: "clearReports",
      name: "Clear Reports",
      field: "reports",
      width: 115,
      formatter: FORMATTERS.clearReports
    }, {
      id: "reportCount",
      name: "Reports",
      field: "reports",
      width: 75,
      formatter: FORMATTERS.reports
    }];

  if (isAdmin) {
    COLUMNS = COLUMNS.map(function (item) {
      if (["title", "description", "thumbnail"].indexOf(item.field) !== -1) {
        item.editor = Slick.Editors.Text;
      }
      return item;
    });
    ADMIN_COLS.forEach(function (col) {
      COLUMNS.unshift(col);
    });
  }

  var escapeMap = {
      "&": "&amp;",
      "\"": "&quot;",
      "'": "&#39;",
      "<": "&lt;",
      ">": "&gt"
    },
    reverseEscapeMap = {
      "&amp;": "&",
      "&quot;": "\"",
      "&#39;": "'",
      "&lt;": "<",
      "&gt;": ">"
    };

  function lookupChar(ch) {
    return escapeMap[ch];
  }

  function lookupReverseChar(ch) {
    return reverseEscapeMap[ch];
  }

  function escapeChars(str) {
    if (!str) {
      return "";
    }
    return str.replace(/[&"'<>]/g, lookupChar);
  }

  function unescapeChars(str) {
    if (!str) {
      return "";
    }
    return str.replace(/(&amp;|&quot;|&#39;|&lt;|&gt;)/g, lookupReverseChar);
  }

  function trimItems(items) {
    return items.map(function (item) {
      return item.trim();
    });
  }

  function sanitize(data) {
    return data.map(function (make) {
      make.title = escapeChars(make.title);
      make.description = escapeChars(make.description);
      make.tags = make.tags.map(function (tag) {
        return escapeChars(tag);
      });
      return make;
    });
  }

  var MakePager = function (settings) {
    var STATUS_TEMPLATE = "Page {{pagenum}} of {{pagetotal}} - {{hits}} total hits",
      DEFAULT_PAGE_SIZE = 100;

    var goFirst = settings.goFirst,
      goPrevious = settings.goPrevious,
      goNext = settings.goNext,
      goLast = settings.goLast,
      goToInput = settings.goToInput,
      goToBtn = settings.goToBtn,
      navStatus = settings.navStatus,
      errorElem = settings.errorElement,
      loadingElem = settings.loadingElem,
      pageTotalToggles = settings.pageTotalToggles,
      currentQuery = {},
      resultsPerPage = DEFAULT_PAGE_SIZE,
      forEach = Array.prototype.forEach,
      currentPage = 1,
      totalPages = 1;

    function setQuery(type, query, sort) {
      currentQuery.type = type;
      currentQuery.query = query;
      currentQuery.sort = sort;
    }

    function handleMakes(err, data, total, page) {
      if (err || !data) {
        errorElem.classList.remove("hidden");
        errorElem.textContent = "Error retrieving data: " + err;
        return;
      } else if (!data.length) {
        if (total) {
          return goToPage(Math.ceil(total / resultsPerPage));
        }
        data = [];
        totalPages = 1;
        currentPage = 1;
        total = 0;
      } else {
        totalPages = Math.ceil(total / resultsPerPage);
        currentPage = page;
      }

      navStatus.textContent = STATUS_TEMPLATE
        .replace("{{pagenum}}", currentPage)
        .replace("{{pagetotal}}", totalPages)
        .replace("{{hits}}", total);

      dataView.beginUpdate();
      dataView.setItems(sanitize(data));
      dataView.endUpdate();
      grid.render();
    }

    function goToPage(num) {
      if (currentQuery.type && currentQuery.query) {
        if (currentQuery.type === "tags") {
          currentQuery.query = trimItems(currentQuery.query.split(","));
        }
        make[currentQuery.type](currentQuery.query);
      }

      loadingElem.classList.remove("spin-hidden");

      make.limit(resultsPerPage)
        .page(num);

      make.sortByField(currentQuery.sort, "desc");

      make.then(function (err, data, total) {
        loadingElem.classList.add("spin-hidden");
        handleMakes(err, data, total, num);
      });
    }

    function setPage(num) {
      num = num ? +num : 1;
      if (num < 1 || num > totalPages) {
        return;
      }
      goToPage(num);
    }

    function checkInputRange(val) {
      if (val <= 0) {
        goToInput.value = 1;
        return 1;
      } else if (val > totalPages) {
        goToInput.value = totalPages;
        return totalPages;
      }
      return val;
    }

    function validInput(val) {
      if (!val || isNaN(val)) {
        goToInput.classList.add("invalid-input");
        return false;
      }
      goToInput.classList.remove("invalid-input");
      return true;
    }

    goFirst.addEventListener("click", function () {
      setPage(1);
    }, false);

    goPrevious.addEventListener("click", function () {
      setPage(currentPage - 1);
    }, false);

    goNext.addEventListener("click", function () {
      setPage(currentPage + 1);
    }, false);

    goLast.addEventListener("click", function () {
      setPage(totalPages);
    }, false);

    goToInput.addEventListener("keypress", function (e) {
      var val;
      if (e.which === 13) {
        e.preventDefault();
        e.stopPropagation();
        val = +goToInput.value;
        if (!validInput(val)) {
          return;
        }
        setPage(checkInputRange(val));
      }
    }, false);

    goToBtn.addEventListener("click", function () {
      var val = +goToInput.value;
      if (!validInput(val)) {
        return;
      }
      setPage(checkInputRange(val));
    }, false);

    forEach.call(pageTotalToggles, function (elem) {
      elem.addEventListener("click", function () {
        if (this.classList.contains("selected")) {
          return;
        }
        forEach.call(pageTotalToggles, function (elem) {
          if (this !== elem && elem.classList.contains("selected")) {
            elem.classList.remove("selected");
          }
        }, this);
        this.classList.add("selected");
        resultsPerPage = +elem.getAttribute("data-value");
        goToPage(currentPage);
      }, false);
    });

    this.goToPage = goToPage;
    this.setQuery = setQuery;

    return this;
  };

  var csrfToken = document.querySelector("meta[name=csrf-token]").getAttribute("content"),
    make = new window.Make({
      apiURL: "/admin",
      csrf: csrfToken,
      // fake Hawk creds
      hawk: {
        id: "000",
        key: "000"
      }
    }),
    searchTypeSelector = document.querySelector("#filter-type"),
    sortByUpdated = document.querySelector("#sort-by-updated"),
    sortByReports = document.querySelector("#sort-by-report"),
    sortByLikes = document.querySelector("#sort-by-likes"),
    searchValue = document.querySelector("#search-tag"),
    searchBtn = document.querySelector("#search"),
    gridArea = document.querySelector("#data-table-area"),
    identity = document.querySelector("#identity").textContent,
    errorSpan = document.querySelector("#error-message"),
    dataView = new Slick.Data.DataView(),
    grid = new Slick.Grid(gridArea, dataView, COLUMNS, {
      autoEdit: false,
      editable: true,
      enableTextSelectionOnCells: true,
      topPanelHeight: 200
    }),
    pager = new MakePager({
      goFirst: document.querySelector("#nav-first"),
      goPrevious: document.querySelector("#nav-previous"),
      goNext: document.querySelector("#nav-next"),
      goLast: document.querySelector("#nav-last"),
      goToInput: document.querySelector("#nav-go-to-page"),
      goToBtn: document.querySelector("#nav-go-to-page-btn"),
      navStatus: document.querySelector("#nav-status"),
      loadingElem: document.querySelector("#nav-loading"),
      pageTotalToggles: document.querySelectorAll(".nav-page-total-setting"),
      errorElement: errorSpan
    });

  window.removeClick = function (id) {
    make.remove(id, function (err) {
      if (err) {
        errorSpan.classlist.remove("hidden");
        errorSpan.textContent = "Error Deleting! " + JSON.stringify(err);
      } else {
        dataView.deleteItem(id);
        grid.invalidate();
        grid.render();
      }
    });
  };

  window.clearReports = function (id) {
    make.update(id, {
      reports: []
    }, function (err, updatedMake) {
      if (err) {
        errorSpan.classlist.remove("hidden");
        errorSpan.textContent = "Error Deleting! " + JSON.stringify(err);
      } else {
        dataView.updateItem(id, updatedMake);
        grid.invalidate();
        grid.render();
      }
    });
  };

  grid.onCellChange.subscribe(function (e, data) {
    var make = data.item;
    make.tags = Array.isArray(make.tags) ? make.tags : trimItems(make.tags.split(","));
    make.tags = make.tags.map(function (tag) {
      return unescapeChars(tag);
    });
    make.title = unescapeChars(make.title);
    make.description = unescapeChars(make.description);

    make.update(identity, function (err, updated) {
      if (err) {
        errorSpan.classList.remove("hidden");
        errorSpan.textContent = "Error Updating! " + JSON.stringify(err);
        return;
      }

      dataView.updateItem(data.item.id, sanitize([make])[0]);
    });
  });

  dataView.onRowCountChanged.subscribe(function () {
    grid.updateRowCount();
    grid.render();
  });

  dataView.onRowsChanged.subscribe(function (e, data) {
    grid.invalidateRows(data.rows);
    grid.render();
  });

  grid.onSort.subscribe(function (e, data) {
    if (data.sortCol.field === "tags") {
      // When sorting by tag, sort each array individually and then compare the first element of each Array.
      dataView.sort(function (a, b) {
        a.tags.sort();
        b.tags.sort();
        if (!a.tags[0]) {
          return 1;
        } else if (!b.tags[0]) {
          return 0;
        }
        return (a.tags[0] > b.tags[0]) ? 1 : -1;
      }, data.sortAsc);
    } else {
      dataView.fastSort(data.sortCol.field, data.sortAsc);
    }
  });

  function doSearch() {
    var sort = document.querySelector("input[name=sort-by]:checked").value;
    pager.setQuery(searchTypeSelector.value, searchValue.value, sort);
    errorSpan.classList.add("hidden");
    errorSpan.textContent = "";
    pager.goToPage(1);
  }

  searchBtn.addEventListener("click", doSearch, false);
  sortByReports.addEventListener("change", doSearch, false);
  sortByLikes.addEventListener("change", doSearch, false);
  sortByUpdated.addEventListener("change", doSearch, false);

  // Press enter to search
  searchValue.addEventListener("keypress", function (e) {
    if (e.which === 13) {
      e.preventDefault();
      e.stopPropagation();
      doSearch();
      searchValue.blur();
    }
  }, false);

  // On initial load, Query for all makes.
  pager.setQuery();
  pager.goToPage(1);

  var contactEmail = document.querySelector("#app-contact"),
    domain = document.querySelector("#app-domain"),
    createApp = document.querySelector("#add-app"),
    createResult = document.querySelector("#app-result");

  function generateKeys() {
    var request = new XMLHttpRequest();

    request.open("POST", "/admin/api/app", true);
    request.setRequestHeader("X-CSRF-Token", csrfToken); // express.js uses a non-standard name for csrf-token
    request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    request.onreadystatechange = function () {
      var response,
        error;
      if (this.readyState === 4) {
        try {
          response = JSON.parse(this.responseText);
          error = response.error;
        } catch (exception) {
          error = exception;
        }
        if (error) {
          createResult.value = JSON.stringify(error, null, 2);
        } else {
          createResult.value = JSON.stringify(response, null, 2);
        }
      }
    };
    request.send(JSON.stringify({
      contact: contactEmail.value,
      domain: domain.value
    }));
  }

  if (isAdmin) {
    createApp.addEventListener("keypress", function (e) {
      if (e.which === 13) {
        e.preventDefault();
        e.stopPropagation();
        generateKeys();
      }
    }, false);

    createApp.addEventListener("click", generateKeys, false);
  }

  // Remix Counter

  var remixIdInput = document.querySelector("#remix-count-id"),
    remixFromInput = $("#remix-count-from"),
    remixToInput = $("#remix-count-to"),
    getRemixCountBtn = document.querySelector("#get-count"),
    remixCountResult = document.querySelector("#remix-count-result");

  window.updateRemixId = function (id) {
    remixIdInput.value = id;
  };

  $.datepicker.setDefaults({
    dateFormat: "dd-mm-yy",
    contrainInput: true
  });

  function getDate(input) {
    return input.datepicker("getDate").getTime();
  }

  remixFromInput.datepicker({
    onClose: function (dateString, p) {
      if (getDate(remixFromInput) > getDate(remixToInput)) {
        remixToInput.datepicker("setDate", dateString);
      }
    }
  }).datepicker("setDate", "-1d");

  remixToInput.datepicker({
    onClose: function (dateString, p) {
      if (getDate(remixToInput) < getDate(remixFromInput)) {
        remixFromInput.datepicker("setDate", dateString);
      }
    }
  }).datepicker("setDate", new Date(Date.now()));

  getRemixCountBtn.addEventListener("click", function () {
    if (!remixIdInput.value) {
      return;
    }
    make.remixCount(
      remixIdInput.value, {
        from: remixFromInput.datepicker("getDate").setHours(0, 0, 0),
        to: remixToInput.datepicker("getDate").setHours(23, 59, 59)
      },
      function (err, res) {
        if (err) {
          errorSpan.classList.remove("hidden");
          errorSpan.textContent = "Error! " + JSON.stringify(err);
          return;
        }
        errorSpan.classList.add("hidden");
        remixCountResult.textContent = res.count;
      }
    );
  }, false);

  var auth = new window.WebmakerAuthClient({
    csrfToken: csrfToken
  });

  auth.on("logout", function () {
    window.location.replace("./login");
  });

  $(".webmaker-logout").click(auth.logout);

  auth.verify();
}, false);
