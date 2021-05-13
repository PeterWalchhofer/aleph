import React from "react"

export default function ReconcInfo(props) {
    const { activeSvcName, handleChangeSvc, allServices, activeSchema } = props


    function renderRadioInput(svc) {
        const disabled = !svc.supportedTypes.includes(activeSchema.name)

        return (
            <option name="recService" disabled={disabled}>
                {svc.name}
            </option>
        )
    }
    function handleChange(event){
        handleChangeSvc(event.target.value)
    }

    return (
        <div className="reconc-svc-info">
            <p>Reconciliation Service:</p>
            <select onChange={handleChange} value={activeSvcName}>
                {allServices.map(svc => renderRadioInput(svc))}
            </select>
        </div>
    )
}