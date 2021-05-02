import React from 'react';
import { Button } from '@blueprintjs/core';
import { injectIntl, defineMessages } from 'react-intl';


const messages = defineMessages({
  reconcile: {
    id: 'entity.manager.reconcile',
    defaultMessage: 'Reconcile',
  }
});


class EntityReconcileButton extends React.Component {

  render() {
    const {intl, actionType, navigate } = this.props;
    const buttonText = intl.formatMessage(messages[actionType]);
    const buttonIcon = "chevron-up"

    return (
      <>
        <Button icon={buttonIcon} onClick={() => navigate(actionType)} className="EntityActionBar__delete">
          {buttonText}
        </Button>
       
      </>
    );
  }
}

EntityReconcileButton = injectIntl(EntityReconcileButton);
export default EntityReconcileButton;
