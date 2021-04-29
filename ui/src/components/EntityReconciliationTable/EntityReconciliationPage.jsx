import React, { Component, useEffect, useState } from "react";
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
import ReconcApi from "./ReconciliationApi";

const messages = defineMessages({
  search_placeholder: {
    id: "entity.manager.search_placeholder",
    defaultMessage: "Search {schema}",
  },
  empty: {
    id: "entity.manager.search_empty",
    defaultMessage: "No matching {schema} results found",
  },
  edge_create_success: {
    id: "entity.manager.edge_create_success",
    defaultMessage: "Successfully linked {source} and {target}",
  },
  add_to_success: {
    id: "entity.manager.entity_set_add_success",
    defaultMessage:
      "Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}",
  },
  bulk_import: {
    id: "entity.viewer.bulk_import",
    defaultMessage: "Bulk import",
  },
  add_link: {
    id: "entity.viewer.add_link",
    defaultMessage: "Create link",
  },
  add_to: {
    id: "entity.viewer.add_to",
    defaultMessage: "Add to...",
  },
});

export function EntityReconciliationPage(props) {
    const [visibleProps, setVisibleProps] = useState([])
    const [reconciled, setReconciled] = useState([])
    const reconcApi = new ReconcApi()

    const {result} = props
    const entities = result.results.slice(result.offset)
  // TODO create query from entities and add to row
  

  useEffect(()=> {
    fetchIfNeeded();
  },[]);

  useEffect(() => {
    const {result} = props
    console.log("RESULT LENGTH", result.results.length)


    const visibleProps = getVisibleProperties(result.results);
    console.log("VISIBLE PROPS", visibleProps)
    setVisibleProps(visibleProps || [])
    console.log(visibleProps)
    fetchReconciliation()
  }, [props.result.results]);


  async function fetchReconciliation(){
    setReconciled(reconcApi.fetchReconciled(entities))
  }

  async function fetchIfNeeded() {
    const { query, queryEntities } = props;
    //const query_limited = query.setPlain("limit", 999);
    await queryEntities({ query });
    
    
  };

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
    const {result} = props
    return result.results.find(({ id }) => entityId === id);
  };

  
    
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
      queryEntities
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
      </div>)
    
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
