import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import {  Button } from '@blueprintjs/core';
import { compose } from 'redux';

import CandidateSelection from './CandidateSelection';

import "./EntityReconciliationPage"


export function ReconciliationTable(props) {
    const { entities, visibleProps, reconciled } = props
    const [headerRow, setHeaderRow] = useState([])
    const [entityRows, setEntityRows] = useState([])


    useEffect(() => {
        if (entities.length > 0 & visibleProps.length >0 ){
        setHeaderRow(getHeaderRow())
        setEntityRows(entities2rows())
        console.log("RERENDER")
        }
        //entities2rows()
    }, [entities, props.reconciled])

    function entities2rows() {
        const rows = []
        entities.forEach((ent, idx) => {
            const propCells = visibleProps.map(property => {
                let values = ent.getProperty(property.name);
               
                if (property.type.name === 'entity') {
                    values = values.map((v) => typeof v === 'string' ? v : v.id);
                }

                return ({
                    value: values,
                    data: { entity: ent, property },
                })
            })
            rows.push(propCells)
        })
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

    function renderValue(entityCell) {
        const propType = entityCell.data.property.type

        let propCb;

        switch (propType.name) {
            case "url":
                propCb = (val, idx) =>
                    <span>
                        <a key = {idx} href={val}>{val}</a>
                    </span>
                break;
                
            default: 
                propCb = (val, idx) => <span key={idx}>{val}</span>
        }
        const separator = <span class="separator"> · </span>
        const values = entityCell.value
            .map(propCb)
            .reduce((acc, elem) => {
                return acc === null ? [elem] : [...acc, separator, elem]
            }, null)
        // Reducer logic from https://stackoverflow.com/questions/44959437/join-jsx-with-jsx/44959541#44959541

        return values
    }

    function renderRow(entityRow, idx) {
        const { reconcApi, idProperty, updateEntity } = props

        const entity = entityRow[0].data.entity
        const cells = []
        cells.push(
            <td col={0} row={idx} className="reconcileCell">
                <CandidateSelection
                    candidates={reconciled[entity?.id]}
                    entity={entity}
                    reconcApi={reconcApi}
                    idProperty={idProperty}
                    updateEntity={updateEntity} />
            </td>
        )
        cells.push(entityRow.map((entityCell, colIdx) =>
            <td row={idx + 1} col={colIdx + 1} >
                <div className="TableEditor__overflow-container">
                    <span className="PropertyValues">
                        {renderValue(entityCell)}
                    </span>
                </div>
            </td>))
        return (
            <tr key={entity.id}>
                {cells}
            </tr>)

    }
    return (
        <div className="ReconciliationTable">
            <span className="data-grid-container">

                <table className="data-grid">
                    <thead>
                        <tr>
                            {headerRow.map((col, idx) => <th row="0" col={idx} key={"0"+idx} className="header">{col}</th>)}
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
