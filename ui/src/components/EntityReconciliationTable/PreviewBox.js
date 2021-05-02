import React, { useState } from "react";
import { Spinner } from '@blueprintjs/core';

export default function PreviewBox(props) {
    const { url, width, height } = props;
    const [isLoading, setIsLoading] = useState(true)

    function onLoad() {
        setIsLoading(false)
    }
    console.log("PRECVIEWBOX", props)
    return (
        <div className="PreviewBox" >
            <span className="preview-content">
                {isLoading && (
                    <div className="spinner">
                        <Spinner className="bp3-small" />
                    </div>)}

                <iframe src={url}
                    titile="Reconciliation Candidate"
                    frameBorder="0"
                    width={width + 10}
                    height={height + 20}
                    onLoad={onLoad}
                    sandbox="" />


            </span>
        </div>
    )

}