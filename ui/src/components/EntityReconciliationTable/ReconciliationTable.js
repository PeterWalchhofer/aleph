import React, { Component, useEffect, useState } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Divider, Button } from '@blueprintjs/core';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { Count, ErrorSection, QueryInfiniteLoad } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import DocumentSelectDialog from 'dialogs/DocumentSelectDialog/DocumentSelectDialog';
import EntityActionBar from 'components/Entity/EntityActionBar';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getEntityLink from 'util/getEntityLink';
import CandidateSelection from './CandidateSelection';

import "./EntityReconciliationPage"


export function ReconciliationTable(props) {
    const { entities, visibleProps, reconciled } = props
    const [headerRow, setHeaderRow] = useState([])
    const [entityRows, setEntityRows] = useState([])


    useEffect(() => {
        console.log(entities, "ENTITIES IN TABLE")
        setHeaderRow(getHeaderRow())
        setEntityRows(entities2rows())
        console.log("RERENDER")
        //entities2rows()
    }, [entities, props.reconciled])

    function entities2rows() {
        const rows = []
        console.log("ENTITIES", entities)
        console.log(entities[0])
        entities.forEach((ent, idx) => {
            //console.log(entities[ent])
            //console.log(visibleProps)
            const propCells = visibleProps.map(property => {
                let values = ent.getProperty(property.name);
                //console.log(property.type.name)
                if (property.type.name === 'entity') {
                    values = values.map((v) => typeof v === 'string' ? v : v.id);
                }
                return ({
                    //...getCellBase('property'),
                    value: values,
                    data: { entity: ent, property },
                })
            })
            rows.push(propCells)
        })
        console.log(rows)
        return rows

    }


    function renderColumnHeader(property) {
        const { sort, sortColumn } = props;

        const isSorted = sort && sort.field === property.name;
        const sortIcon = isSorted ? (sort && sort.direction === 'asc' ? 'caret-up' : 'caret-down') : null;
        return (
            <Button
                onClick={() => sortColumn(property.name)}
                minimal
                fill
                text={property.label}
            />
        );
    }


    function getHeaderRow() {
        const { visibleProps } = props;
        const headerCells = visibleProps.map(property => renderColumnHeader(property));
        return ["Reconcile", ...headerCells];
    }

    function renderValue(entityCell){
        const propType = entityCell?.data.property.type
        
        let propCb = (val) => <span>{val}</span>
        switch(propType.name){
            case "url":
                propCb = (val) => <span><a href={val}>{val}</a></span>

        }
        return entityCell.value.map(propCb)
    }

    function renderRow(entityRow, idx) {
        const { reconcApi, idProperty, updateEntity } = props
        const entity = entityRow[0]?.data.entity
        const cells = []
        cells.push(
            <td col={0} row={idx}>
                <CandidateSelection
                    candidates={reconciled[entity?.id]}
                    entity={entity}
                    reconcApi={reconcApi}
                    idProperty={idProperty}
                    updateEntity={updateEntity} />

            </td>
        )
        cells.push(entityRow.map((entityCell, colIdx) =>
            <td row={idx} col={colIdx + 1} >
                <div className="TableEditor__overflow-container">
                    <span className="PropertyValues">
                        {renderValue(entityCell)}
                    </span>
                </div>
            </td>))
        return (
            <tr>
                {cells}
            </tr>)

    }
    return (
        <div className="ReconciliationTable">
        <span className="data-grid-container">
        
        <table className="data-grid">
            <thead>
                <tr key={0}>
                    {headerRow.map(col => <th className="header">{col}</th>)}
                </tr>
            </thead>
        
            <tbody>
                {entityRows.map((row, idx) => renderRow(row, idx))}
            </tbody>
        </table>
        
        </span>
        </div>

    )

}


export default compose(
    injectIntl,
)(ReconciliationTable)
