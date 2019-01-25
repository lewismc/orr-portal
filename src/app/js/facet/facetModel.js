(function() {
  'use strict';

  angular.module('orrportal.facetModel', [])

    .factory('facetModel', facetModelFactory)
  ;

  facetModelFactory.$inject = ['$rootScope'];

  function facetModelFactory($rootScope) {
    if (appUtil.debug) console.log("++facetModel++");

    var ontologies = [];
    var dataHasSubmitter = false;

    var mostRecentByOwner = false;

    var UNDEFINED_FIELD_VALUE = '<i class="gray">-undefined-</i>';

    // determines the desired display order
    var facetKeys = [
      "owner",
      "usr",
      "ontologyStatus",
      "resourceType",
      "ontologyType",
      "hosting"
    ];

    // facet definitions
    var facetDict = {
      owner: {
        label: "Owner",
        fieldName: "ownerName",
        list: [],
        selection: []
      },
      usr: {
        label: "Submitter",
        fieldName: "submitter",
        list: [],
        selection: []
      },
      ontologyType: {
        label: "Ontology type",
        fieldName: "ontologyType",
        list: [],
        selection: []
      },
      ontologyStatus: {
        label: "Status",
        fieldName: "status",
        list: [],
        selection: []
      },
      resourceType: {
        label: "Resource type",
        fieldName: "resourceType",
        list: ['discipline', 'parameter', 'platform', 'sensor', 'unit'],
        selection: []
      },
      hosting: {
        label: "Hosting",
        list: ['fully-hosted', 're-hosted'],
        selection: []
      }
    };


    // the exposed facets (as an array and as a dict) depending on privileges under which
    // the app is running:
    var facetArray = [];
    var facets = {};
    resetFacets();

    return {
      getMostRecentByOwner: function() {
        return mostRecentByOwner;
      },
      setMostRecentByOwner: function(mrbo) {
        mostRecentByOwner = mrbo;
        refreshFacets();
      },
      getOntologies: function getOntologies() { return ontologies; },
      getFacetArray: function getFacetArray() { return facetArray; },
      getFacets:     function getFacets()     { return facets; },

      setOntologies: setOntologies,
      refreshFacets: refreshFacets,

      anyFacetSelection:   anyFacetSelection,
      clearFacetSelection: clearFacetSelection
    };

    function resetFacets() {
      facetArray = [];
      facets = {};
      _.each(facetKeys, function(facetKey) {
        if(facets[facetKey] !== undefined) alert("ERROR: repeated facet key: " + facetKey);
        if(facetDict[facetKey] === undefined) alert("ERROR: facet key not found: " + facetKey);
        var facet = facetDict[facetKey];
        if (facetKey !== "usr" || dataHasSubmitter) {
          facet.key = facetKey;
          facets[facetKey] = facet;
          facetArray.push(facet);
        }
      });
    }

    function setOntologies(onts) {
      dataHasSubmitter = _.some(onts, "submitter");
      //console.log(appUtil.logTs() + ": facetModel on gotOntologies");
      resetFacets();
      ontologies = onts;
      _.each(facets, function(facet, facetKey) {
        if (facet.fieldName) {
          prepareFacetWithFieldName(facetKey, facet.fieldName);
        }
        else {
          prepareFacetSelectionFromList(facetKey);
        }
      });
      applyFilters();
    }

    // gets the value of an ontology field for purposes of the faceted search
    function getFieldValue(ont, fieldName) {
      var val = ont[fieldName];
      return val ? val.toString().toLowerCase() : UNDEFINED_FIELD_VALUE;
    }

    function prepareFacetWithFieldName(facetKey, fieldName) {
      facets[facetKey].list = _.chain(ontologies)
        .map(function(ont) { return getFieldValue(ont, fieldName) })
        .uniq()
        .sortBy(function(val) { return (val === UNDEFINED_FIELD_VALUE ? "z" : " ") + val })
        .value();
      prepareFacetSelectionFromList(facetKey);
    }
    function prepareFacetSelectionFromList(facetKey) {
      facets[facetKey].selection = _.map(facets[facetKey].list, function(owner) {
        return {
          label: owner,
          selected: false
        };
      });
    }

    function refreshFacets() {
      applyFilters();
    }

    function applyFilters() {
      var selectedOnts = ontologies;

      if (mostRecentByOwner) {
        selectedOnts = [];
        var byOwner = _.groupBy(ontologies, "ownerName");
        _.each(byOwner, function(ownerOnts) {
          var mostRecentOnt = _.sortBy(ownerOnts, "version")[ownerOnts.length - 1];
          selectedOnts.push(mostRecentOnt);
        })
      }

      _.each(facets, function(facet, facetKey) {
        /*
         * in general, both no explicit selection and complete explicit selection
         * means no filtering by this facet.
         */
        if (facet.fieldName) {
          /*
           * according to facet having a fieldName:
           */
          var selectedByFieldName = getSelectedLabels(facet.selection);
          //console.log(appUtil.logTs() + ": selectedByFieldName:", selectedByFieldName);
          if (selectedByFieldName.length && selectedByFieldName.length < facet.list.length) {
            selectedOnts = _.filter(selectedOnts, function(ont) {
              var val = getFieldValue(ont, facet.fieldName);
              return _.includes(selectedByFieldName, val);
            });
          }
        }
        else if (facetKey === "hosting") {
          /*
           * only consider 3 mutually exclusive cases:
           *   - all selected (either explicitly or implicitly by default)
           *   - fully-hosted selected
           *   - re-hosted selected
           */
          var selectedHosting = getSelectedLabels(facet.selection);
          if (selectedHosting.length === 1) {
            var takeSelfHosted = selectedHosting[0] === "fully-hosted";
            var orrOntRest = appConfig.orront.rest;
            selectedOnts = _.filter(selectedOnts, function(ont) {
              var isSelfHosted = bUtil.uriEqualOrHasPrefixWithSlash(ont.uri, orrOntRest);
              return takeSelfHosted === isSelfHosted;
            });
          }
        }
      });

      $rootScope.$broadcast('evtSetFacetSelectedOntologies', selectedOnts);

      function getSelectedLabels(selection) {
        return _.chain(selection).filter('selected').map('label').value();
      }
    }

    /**
     * True if there is any explicit selection in a facet (if facetKey given)
     * or in any of all facets.
     */
    function anyFacetSelection(facetKey) {
      if (facetKey) {
        return _.some(facets[facetKey].selection, {selected: true});
      }
      else {
        return _.some(_.keys(facets), anyFacetSelection);
      }
    }

    /**
     * Clears all explicit selection in a facet (if facetKey given)
     * or in all facets.
     */
    function clearFacetSelection(facetKey) {
      if (facetKey) {
        _.map(facets[facetKey].selection, function (facet) {
          facet.selected = false;
        });
      }
      else {
        _.each(_.keys(facets), clearFacetSelection);
      }
    }
  }

})();
