import React, { useState } from "react";
import { Spinner } from '@blueprintjs/core';

export default function PreviewBox(props) {
    const { url, width, height , title} = props;
    const [isLoading, setIsLoading] = useState(true)

    function onLoad() {
        setIsLoading(false)
    }
    
    return (
        <div className="PreviewBox" >
            <span className="preview-content">
                {isLoading && (
                    <div className="spinner">
                        <Spinner className="bp3-small" />
                    </div>)}

                <iframe src={url}
                    titile={"Reconciliation Candidate of " + title}
                    frameBorder="0"
                    width={width + 10}
                    height={height + 20}
                    onLoad={onLoad}
                    loading="eager"
                    sandbox="allow-same-origin" 
                    />

            </span>
        </div>
    )

}