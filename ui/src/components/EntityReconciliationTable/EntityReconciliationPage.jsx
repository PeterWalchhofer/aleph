import React, { useEffect, useState, useRef } from "react";
import { defineMessages, injectIntl } from "react-intl";

import _ from "lodash";
import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import uniqBy from "lodash/uniqBy";

import entityEditorWrapper from "components/Entity/entityEditorWrapper";
import { ErrorSection } from "components/common";

import { queryEntities } from "actions";
import { selectEntitiesResult } from "selectors";

import "./EntityReconciliationPage.scss";
import QueryNextButton from "./QueryNextButton";
import ReconciliationTable from "./ReconciliationTable";
import ReconciliationApi from "./ReconciliationApi";
import { reconcConfig, PropertyMapper } from "./ReconcConfig";
import ReconcInfo from "./ReconcInfo";

const messages = defineMessages({
  empty: {
    id: "entity.manager.search_empty",
    defaultMessage: "No matching {schema} results found",
  },
});

export function EntityReconciliationPage(props) {
  const { result, schema, intl } = props;
  const [shouldReloadRec, setShouldReloadRec] = useState(false);
  const [mapper, setMapper] = useState();

  const [reconcApi, setReconcApi] = useState();
  const [isInit, setIsInit] = useState(false);
  const entities = result.results.slice(result.offset);
  const isMountedRef = useRef(null);

  const [visibleProps, setVisibleProps] = useState(
    getVisibleProperties(entities)
  );
  const [reconciled, setReconciled] = useState([]);

  useEffect(() => {
    console.log("MOUNT")
    isMountedRef.current = true;
    fetchIfNeeded();
    const map = new PropertyMapper(reconcConfig, intl.locale);

    isMountedRef.current && setMapper(map);
    isMountedRef.current && setReconcApi(getReconciliationService(map));
  
    return () => isMountedRef.current = false;
  }, []);

  useEffect(() => {
    setShouldReloadRec(true);
  }, [result.offset, result.shouldLoad, result.results.length]);

  useEffect(() => {
    async function init() {
      await reconcApi.fetchServices();
      isMountedRef.current && setIsInit(true);
    }
    isMountedRef.current = true;

    reconcApi &&  init();

    
    return () => isMountedRef.current = false;
  }, [reconcApi]);

  useEffect(() => {
    isMountedRef.current = true;
    isInit && shouldReloadRec && isMountedRef.current && fetchReconciliation();
    
    return () => isMountedRef.current = false;
  }, [isInit, shouldReloadRec]);

  useEffect(() => {
    const visibleProps = getVisibleProperties(entities);
    setVisibleProps(visibleProps || []);

    
  }, [result.results]);

  async function fetchReconciliation() {
    if (!entities) {
      return;
    }
    setShouldReloadRec(false);
    const to_rec_entities = entities;
    const recon_responses = await reconcApi.fetchReconciled(to_rec_entities);
    const hashed = {};
    // Combine entities and responses to keep order consistency.
    recon_responses.forEach((rec, i) => {
      hashed[to_rec_entities[i].id] = {
        candidates: rec["result"],
        entity: to_rec_entities[i],
        reconId: to_rec_entities[i].getFirst(reconcApi.idProperty),
      };
    });

    setReconciled(hashed);
  }

  async function fetchIfNeeded() {
    const { query, queryEntities, result } = props;
    if (result.results.shouldLoad) {
      await queryEntities({ query });
      await fetchReconciliation();
    }
  }

  function getReconciliationService(propertyMapper) {
    return new ReconciliationApi(
      propertyMapper.url,
      propertyMapper.idProperty,
      propertyMapper.getTypeMapping(schema.name),
      propertyMapper.getPropertyMapping(schema.schemata)
    );
  }

  function handleChangeSvc(svcName) {
    setIsInit(false);
    const map = new PropertyMapper(reconcConfig, intl.locale, svcName);
    setMapper(map);
    setReconcApi(getReconciliationService(map));
    setReconciled([]);
    setShouldReloadRec(true);
  }

  function updateQuery(newQuery) {
    const { history, location } = props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  function onSortColumn(newField) {
    const { query, sort } = props;
    const { field: currentField, direction } = sort;

    if (currentField !== newField) {
      return updateQuery(query.sortBy(`properties.${newField}`, "asc"));
    }

    // Toggle through sorting states: ascending, descending, or unsorted.
    updateQuery(
      query.sortBy(
        `properties.${currentField}`,
        direction === "asc" ? "desc" : undefined
      )
    );
  }

  function getVisibleProperties(entities) {
    if (!entities.length) {
      return [];
    }
    const { schema } = props;

    const requiredProps = schema.required.map((name) =>
      schema.getProperty(name)
    );
    const featuredProps = schema.getFeaturedProperties();

    const filledProps = entities
      .map((entity) => entity.getProperties())
      .reduce((acc, props) => [...acc, ...props]);

    const fullList = uniqBy(
      [...requiredProps, ...featuredProps, ...filledProps],
      "name"
    );

    return fullList.filter((prop) => !prop.stub && !prop.hidden);
  }

  const { query, queryEntities, updateEntity, sort } = props;

  const showEmptyComponent = result.total === 0 && query.hasQuery();

  return (
    <div className="EntityTable">
      <div className="EntityTable__content">
        {showEmptyComponent && (
          <ErrorSection
            icon="search"
            title={intl.formatMessage(messages.empty, {
              schema: schema.plural.toLowerCase(),
            })}
          />
        )}
        {!showEmptyComponent && isInit && (
          <>
            <ReconcInfo
              activeSvcName={mapper.svc_name}
              activeSchema={schema}
              handleChangeSvc={handleChangeSvc}
              allServices={mapper.getAllServices()}
            />
            <ReconciliationTable
              entities={entities}
              visibleProps={visibleProps}
              reconciled={reconciled || {}}
              reconcApi={reconcApi}
              idProperty={reconcApi.idProperty}
              updateEntity={updateEntity}
              sortColumn={onSortColumn}
              sort={sort}
            />
            <QueryNextButton
              query={query}
              result={result}
              fetch={queryEntities}
              loadOnScroll={false}
            />
            <QueryNextButton
              query={query}
              result={result}
              fetch={queryEntities}
              loadOnScroll={false}
              next={false}
            />
          </>
        )}
      </div>
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const sort = query.getSort();

  return {
    sort: !_.isEmpty(sort)
      ? {
          field: sort.field.replace("properties.", ""),
          direction: sort.direction,
        }
      : {},
    result: selectEntitiesResult(state, query),
  };
};

export default compose(
  withRouter,
  entityEditorWrapper,
  connect(mapStateToProps, { queryEntities }),
  injectIntl
)(EntityReconciliationPage);
