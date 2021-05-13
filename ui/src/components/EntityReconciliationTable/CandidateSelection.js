import React, { useState } from "react";
import { Spinner } from '@blueprintjs/core';
import "./Candidate.scss";
import PreviewBox from "./PreviewBox";

export default function CandidateSelection(props) {
    const { reconcApi, idProperty, updateEntity } = props
    const candidates = props.candidates?.candidates
    const { entity } = props
    const reconId = entity?.getFirst(reconcApi.idProperty)
    const [hoverId, setHoverId] = useState()


    function handleAccept(candidateId) {
        const modified = entity.clone()
        let propVal = candidateId;

        if (idProperty === "opencorporatesUrl") {
            // This is not very beautiful, but it works. The issue is, that Aleph does not persist IDs for opencorporates, but URLs.
            propVal = "https://opencorporates.com/" + candidateId
        }
        modified.setProperty(idProperty, propVal)

        updateEntity(modified)
    };

    function unHover() {
        setHoverId(undefined)        
    };

    async function renderTooltip(id) {
        setHoverId(id)
    };


    function renderCandidate(candidate) {
        const { id, match } = candidate

        return (
            <div className={"recCandidate"} key={id}>
                {id === hoverId && (
                    <PreviewBox
                        title={candidate.name}
                        url={reconcApi.getPreviewUrl(id)}
                        width={reconcApi.preview["width"]}
                        height={reconcApi.preview["height"]}
                    />

                )}
                <li >
                    <div className="candidateName" >
                        <a onMouseEnter={() => renderTooltip(id)}
                            onMouseLeave={unHover}
                            href={reconcApi.directLink(id)}
                            target="_blank" rel="noopener noreferrer">{candidate.name}</a>
                    </div>
                    <p>Score: {Math.round(candidate.score)}</p>

                    <button className={`candidateAccept ${match ? "recMatch" : ""}`} onClick={() => handleAccept(id)}>
                        {match ? "✔✔" : "✔"}
                    </button>
                </li>

            </div>
        )
    }
    return (
        <div className="CandidateSelection">
            {(candidates?.length > 0 & !reconId) ?
                (
                    <ul>
                        {candidates.map(candidate => renderCandidate(candidate))
                            .reduce((acc, el, idx) => acc === null ? [el] : [...acc, <hr key={idx} />, el], null)}
                    </ul>
                )
                : (Array.isArray(candidates) & !reconId) ?
                    (
                        <p>-</p>
                    )

                    : reconId ?
                        (
                            <p><a href={reconcApi.directLink(reconId)} target="_blank" rel="noopener noreferrer">{entity.getFirst("name")}</a></p>
                        )
                        //else
                        : (
                            <div className="spinner">
                                <Spinner className="bp3-small" />
                            </div>
                        )
            }
        </div>
    )
}