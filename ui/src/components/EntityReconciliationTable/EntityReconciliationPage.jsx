import React, { useEffect, useMemo, useState } from "react";
import { defineMessages, injectIntl } from "react-intl";

import _ from "lodash";
import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import uniqBy from "lodash/uniqBy";

import entityEditorWrapper from "components/Entity/entityEditorWrapper";
import {  ErrorSection } from "components/common";

import { queryEntities } from "actions";
import { selectEntitiesResult } from "selectors";
import getEntityLink from "util/getEntityLink";

import "./EntityReconciliationPage.scss";
import QueryNextButton from "./QueryNextButton";
import ReconciliationTable from "./ReconciliationTable";
import ReconciliationApi from "./ReconciliationApi"

const messages = defineMessages({
  empty: {
    id: "entity.manager.search_empty",
    defaultMessage: "No matching {schema} results found",
  },
});

const reconcConfig = {
  wikidata: {
    url: "https://wikidata.reconci.link/en/api",
    idProperty: "wikidataId"
  }
}


export function EntityReconciliationPage(props) {
  const { result } = props;
  const [reconcApi] = useState(new ReconciliationApi(reconcConfig["wikidata"]["url"], reconcConfig["wikidata"]["idProperty"])) 
  const [isInit, setIsInit] = useState(false)

  
  
  // Up to date entities from Aleph
  const entities = result.results.slice(result.offset);

  // Slower reloading entities from reconciliation
  const to_rec_entities = useMemo(() => entities, [
    result.offset,
    result.shouldLoad,
    result.results.length,
  ]);
  const [visibleProps, setVisibleProps] = useState(getVisibleProperties(entities));
  const [reconciled, setReconciled] = useState([]);


  useEffect(() => {
    fetchIfNeeded();
    init()
  }, []);

  useEffect(() => {
    isInit && fetchReconciliation();
  }, [to_rec_entities, isInit]);

  useEffect(() => {
    const { result } = props;

    const visibleProps = getVisibleProperties(result.results);
    setVisibleProps(visibleProps || []);
  }, [result.results]);

  async function init(){
    await reconcApi.fetchServices()
    setIsInit(true)
  }

  async function fetchReconciliation() {
    if (!to_rec_entities) {
      return;
    }
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

    console.log("RECONCILED", hashed);
    setReconciled(hashed);
  }

  async function fetchIfNeeded() {
    const { query, queryEntities, result } = props;
    if (result.results.shouldLoad) {
      await queryEntities({ query });
      await fetchReconciliation();
    }
  }

  function onEntityClick(entity) {
    if (entity) {
      const { history } = props;
      history.push(getEntityLink(entity));
    }
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

  function updateQuery(newQuery) {
    const { history, location } = props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  function getEntity(entityId) {
    const { result } = props;
    return result.results.find(({ id }) => entityId === id);
  }

  const {
    entityManager,
    query,
    intl,
    schema,
    isEntitySet,
    sort,
    updateStatus,
    writeable,
    queryEntities,
    updateEntity,
  } = props;

  const visitEntity = schema.isThing() ? onEntityClick : undefined;
  const showEmptyComponent = result.total === 0 && query.hasQuery();
 console.log(isInit)
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
            <ReconciliationTable
              entities={entities}
              visibleProps={visibleProps}
              reconciled={reconciled || {}}
              reconcApi={reconcApi}
              idProperty={reconcApi.idProperty}
              updateEntity={updateEntity}
            />
            <QueryNextButton
              query={query}
              result={result}
              fetch={queryEntities}
              loadOnScroll={false}
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
