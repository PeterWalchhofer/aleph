import React, { useEffect, useState } from "react"
import { Spinner } from '@blueprintjs/core';
import "./Candidate.scss"
import PreviewBox from "./PreviewBox";

export default function CandidateSelection(props) {
    const { reconcApi, idProperty, updateEntity } = props
    const candidates = props.candidates?.candidates
    const { entity } = props
    const reconId = entity?.getFirst(reconcApi.idProperty)
    const [hoverId, setHoverId] = useState()



    function handleAccept(candidateId) {
        console.log("FIRE")
        const modified = entity.clone()
        modified.setProperty(idProperty, candidateId)
        updateEntity(modified)

    }
    function unHover() {
       setHoverId(undefined)
    }

    async function renderTooltip(id) {
        console.log("MOURSOUVER")
        setHoverId(id)
    }


    function renderCandidate(candidate) {

        const { id, match } = candidate
        console.log("HOVERSTATE", hoverId)
        return (
            <>
                {id === hoverId && (
                    <PreviewBox
                        url={reconcApi.getPreviewUrl(id)}
                        width={reconcApi.preview["width"]}
                        height={reconcApi.preview["height"]}
                    />

                )}
                <li key={id + entity.id} className="recCandidate">
                    <div className="candidateName" onMouseEnter={() => renderTooltip(id)} onMouseLeave={unHover}>
                        <a href={reconcApi.directLink(id)} target="_blank">{candidate.name}</a></div>
                    <p>Score: {Math.round(candidate.score)}</p>

                    <button className="candidateAccept" onClick={() => handleAccept(id)}>{match ? "✔✔" : "✔"}</button>


                </li>

            </>
        )
    }
    return (
        <div className="CandidateSelection">
            {(candidates?.length > 0 & !reconId) ?
                (
                    <ul>
                        {candidates.map(candidate => renderCandidate(candidate))}
                    </ul>
                )
                : (Array.isArray(candidates) & !reconId) ?
                    (
                        <p>-</p>
                    )

                    : reconId ?
                        (
                            <p><a href={reconcApi.directLink(reconId)} target="_blank">{entity.getFirst("name")}</a></p>
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