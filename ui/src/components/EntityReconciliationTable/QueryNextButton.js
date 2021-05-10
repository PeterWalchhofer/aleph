import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { Button } from '@blueprintjs/core';

class QueryNextButton extends Component {
  // Disclosure: This Component was kept from the original implementation.
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
    this.getPrev= this.getPrev.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    this.props.fetch({ query, result, next: result.next });
  }

  getPrev() {
    const { query, result } = this.props;
    this.props.fetch({ query, result, previous: result.previous });
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.fetch({ query, result });
    }
  }

  render() {
    
    const { loadOnScroll = true, result, next=true} = this.props;
    const canLoadMore = result && result.next && !result.isPending && !result.isError && result.results.length < result.total;
    if (canLoadMore) {
      if (loadOnScroll) {
        return (
          <Waypoint
            onEnter={this.getMoreResults}
            bottomOffset="-100px"
            scrollableAncestor={window}
          />
        );
      } else {
        return (
          <div className="QueryInfiniteLoad">
            <Button
              onClick={next? this.getMoreResults : this.getPrev}
              className="QueryInfiniteLoad__button"
            >
              <FormattedMessage
                id="screen.load_more"
                defaultMessage={next? "Next ❱": "❰ Previous"}
              />
            </Button>
          </div>
        );
      }
    }

    return null;
  }
}

export default injectIntl(QueryNextButton);
