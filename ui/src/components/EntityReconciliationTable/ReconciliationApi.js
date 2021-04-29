import { result } from "lodash"


class ReconcApi {
    constructor() {
        this.url = "https://wikidata.reconci.link/en/api"
        this.mapping = {
            birthDate: "P569",
            birthPlace: "P19",
            email: "P968",
            firstName: "P735",
            lastName: "P734",
            title: "P512",
            website: "P856"
        }
    }

    async fetchReconciled(entities) {
        console.log("MAAAAAAP", this.mapping)
        //const result = await fetch(url)
        const queries = entities.map(entity => this.createQuery(entity, "Q5", this.mapping))
        const batches = this.create_batch_queries(queries)
        const results = []
        
        batches.forEach(async batch => {
            const result = await fetch(this.url, {
                method: "POST",
                body: new URLSearchParams({
                    queries: JSON.stringify(batch)
                })
            })
            const reconciled = await result.json() 
            //console.log(reconciled)
            results.push(Object.values(reconciled))
            
        })
        console.log("WHOOOOOOOOOO", batches.length)
        
        //console.log(queries)
        //console.log("BAAAATCH")
        //console.log(batches)
    }

    createQuery(entity, targetType, mapping, limit = 10) {

        const query_params = {
            query: entity.getFirst("name"),
            type: targetType,
            limit,
            properties: []
        }


        entity.getProperties().forEach(prop => {
            const wikidataId = mapping[prop.name]
            if (wikidataId) {
                const mapped_prop = {
                    pid: wikidataId,
                    v: entity.getProperty(prop.name)
                }
                query_params["properties"].push(mapped_prop)
            }
        })
        return query_params
    }

    create_batch_queries(queries, batch_size = 50) {
        let start = 0
        let end = 0 + batch_size
        const batches = []
        const max = Math.ceil(queries.length / batch_size)
        for (const batch_nr in Array.from({ length: max }, (x, i) => i)) {
            const batch_query = {}
            queries.slice(start, end).forEach((query, idx) => {
                batch_query["q" + idx] = query
            })
            batches.push(batch_query)
            start += batch_size
            end += batch_size
        }
        return batches
    }
}

export default ReconcApi;