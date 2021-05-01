import React, { Component, useEffect, useMemo, useState } from "react";
import { defineMessages, injectIntl } from "react-intl";
import { Divider } from "@blueprintjs/core";
import _ from "lodash";
import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import queryString from "query-string";
import { EdgeCreateDialog, TableEditor } from "@alephdata/react-ftm";
import uniqBy from "lodash/uniqBy";

import entityEditorWrapper from "components/Entity/entityEditorWrapper";
import { Count, ErrorSection, QueryInfiniteLoad } from "components/common";
import { DialogToggleButton } from "components/Toolbar";
import EntitySetSelector from "components/EntitySet/EntitySetSelector";
import DocumentSelectDialog from "dialogs/DocumentSelectDialog/DocumentSelectDialog";
import EntityActionBar from "components/Entity/EntityActionBar";
import EntityDeleteButton from "components/Toolbar/EntityDeleteButton";
import { queryEntities } from "actions";
import { selectEntitiesResult } from "selectors";
import { showErrorToast, showSuccessToast } from "app/toast";
import getEntityLink from "util/getEntityLink";
import {
  Entity as FTMEntity,
  Property as FTMProperty,
  Schema as FTMSchema,
  Value,
} from "@alephdata/followthemoney";
import "./EntityReconciliationPage.scss";
import EntityReconcileButton from "components/Toolbar/EntityReconcileButton";
import QueryNextButton from "./QueryNextButton";
import { entitySetItemsQuery } from "queries";
import ReconciliationTable from "./ReconciliationTable";


const messages = defineMessages({
  empty: {
    id: "entity.manager.search_empty",
    defaultMessage: "No matching {schema} results found",
  },
});

export function EntityReconciliationPage(props) {
  const [visibleProps, setVisibleProps] = useState([]);
  const [reconciled, setReconciled] = useState([]);
  console.log("A");
  const {reconcApi} = props

  const { result } = props;
 
  // Up to date entities from Aleph
 const entities = result.results.slice(result.offset);

  // Slower reloading entities from reconciliation
  const to_rec_entities = useMemo(() => entities, [
    result.offset,
    result.shouldLoad,
    result.results.length,
  ]);

  useEffect(() => {
    fetchIfNeeded();
  }, []);

  useEffect(() => {
    fetchReconciliation();
  }, [to_rec_entities]);

  useEffect(() => {
    //console.log(result)
    const { result } = props;
    console.log("RESULT LENGTH", result);

    const visibleProps = getVisibleProperties(result.results);
    setVisibleProps(visibleProps || []);

    console.log(result.results);
  }, [result.results]);

  /*   useEffect(() => {
    if (result.results.shouldLoad){
      fetchReconciliation();
    }
    console.log(props)
  }, [result.results]); */

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

    console.log("2 FETCHRECONCILIATION\n", hashed);
    setReconciled(hashed);
  }

  async function fetchIfNeeded() {
    const { query, queryEntities, result } = props;
    //const query_limited = query.setPlain("limit", 999);
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
      return;
    }
    const { schema } = props;

    const requiredProps = schema.required.map((name) =>
      schema.getProperty(name)
    );
    const featuredProps = schema.getFeaturedProperties();
    //const filledProps = (entities)
    //.reduce((acc, entity) => [...acc, ...entity.getProperties()]);
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
    collection,
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
        {!showEmptyComponent && (
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
