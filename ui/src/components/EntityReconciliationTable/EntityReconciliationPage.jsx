import React, { Component } from "react";
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

export class EntityReconciliationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleProps: [],
      entities: this.props.result.results,
    };

    this.updateQuery = this.updateQuery.bind(this);
    this.updateSelection = this.updateSelection.bind(this);
    this.getEntity = this.getEntity.bind(this);
  }

  componentDidMount() {
    const { query } = this.props;

    //this.updateQuery(query.setPlain('limit', 999))

    this.fetchIfNeeded();
  }

  componentDidUpdate(prevState, state) {

    const {result} = prevState
    console.log("RESULT LENGTH", result.results.length)
    console.log("STATE LENGTH", state)
    //console.log("STATE LENGTH", state.result.results.length)
    const entitiesAdded = result.results.length > this.state.entities;
    
    if (entitiesAdded){
      const visibleProps = this.getVisibleProperties(this.props.result.results);
      this.setState({visibleProps, entities: result.results})
      console.log(visibleProps)
    }
  }

  async fetchIfNeeded() {
    const { query, result } = this.props;
    const query_limited = query.setPlain("limit", 999);
    await this.props.queryEntities({ query: query_limited });
      
    
  }

  getVisibleProperties(entities) {
    if (!entities.length) {
      return;
    }
    const { schema } = this.props;

    console.log(entities);
    console.log(entities);
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

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  updateSelection(entityIds, newVal) {
    this.setState(({ selection }) => {
      let newSelection;
      if (newVal) {
        newSelection = [...new Set([...selection, ...entityIds])];
      } else {
        newSelection = selection.filter((id) => entityIds.indexOf(id) < 0);
      }
      return { selection: newSelection };
    });
  }

  getEntity(entityId) {
    return this.props.result.results.find(({ id }) => entityId === id);
  }

  render() {
    console.log(this.state)
    //this.getVisibleProperties()
    const {
      collection,
      entityManager,
      query,
      intl,
      result,
      schema,
      isEntitySet,
      sort,
      updateStatus,
      writeable,
    } = this.props;

    const visitEntity = schema.isThing() ? this.onEntityClick : undefined;
    const showEmptyComponent = result.total === 0 && query.hasQuery();

    console.log(this.props);
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
                entities={this.state.entities}
                visibleProps={this.state.visibleProps}
                />
              {/*<QueryInfiniteLoad
                query={query}
                result={result}
                fetch={this.props.queryEntities}
              />*/}
            </>
          )}
        </div>
      </div>
    );
  }
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
