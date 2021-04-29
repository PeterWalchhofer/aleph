import React, { Component } from 'react';
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


//entities2rows()

// function entities2rows(){
//     const rows = []
//     console.log(entities)
//     for (ent in props.entities) {
//         console.log(ent)
//         const propCells = visibleProps.map(property => {
//             let values = ent.getProperty(property.name);
//             if (property.type.name === 'entity') {
//               values = values.map((v) => typeof v === 'string' ? v : v.id);
//             }
//         })     
//         rows.push(propCells)                
//     }
//     return rows

//     }




export class ReconciliationTable extends Component {
    constructor(props) {
        super(props);
       

    }

    componentDidMount() {

    }

    componentDidUpdate() {

    }

    entities2rows() {
        const { entities, visibleProps } = this.props
        const rows = []
        console.log("ENTITIES")
        console.log(entities[0])
        for (let ent in entities) {
            //console.log(entities[ent])
            //console.log(visibleProps)
            const propCells = visibleProps.map(property => {
                let values = entities[ent].getProperty(property.name);
                //console.log(property.type.name)
                if (property.type.name === 'entity') {
                    values = values.map((v) => typeof v === 'string' ? v : v.id);
                }
                return ({
                    //...getCellBase('property'),
                    value: values,
                    data: { entity:entities[ent], property },
                  })
            })
            rows.push(propCells)
        }
        console.log(rows)
        return rows

    }


    renderColumnHeader = (property) => {
        const { sort, sortColumn } = this.props;
    
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
    

      
  regenerateTable = () => {
    this.setState({
      showTopAddRow: false,
      headerRow: this.getHeaderRow(),
      entityRows: this.getEntityRows(),
      updatedEntityIds: [],
    });
  }

    getHeaderRow = () => {
        const { visibleProps } = this.props;
        const headerCells = visibleProps.map(property =>  this.renderColumnHeader(property));
        return [ ...headerCells];
    }




    render() {
        const rows = this.entities2rows()
        console.log(rows)
        return (
            <table>
            <thead>
            <tr key={0}>
                {this.getHeaderRow().map(col => <th>{col}</th>)}
            </tr>
            </thead>
            <tbody>
            {this.entities2rows().map(row => 
                <tr>{row.map(col => <td>{col.value}</td>)}</tr>)
            }
            </tbody>
        </table>

        )
    }
}


export default compose(
    injectIntl,
)(ReconciliationTable)
