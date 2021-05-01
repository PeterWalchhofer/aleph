import { bind, result, stubString } from "lodash"


class ReconcApi {
    constructor(url, idProperty) {
        this.url = url
        this.fetchServices()
        this.view = ""
        this.idProperty = idProperty // e.g. wikidataId in schema

        this.mapping = {
            birthDate: "P569",
            birthPlace: "P19",
            email: "P968",
            firstName: "P735",
            lastName: "P734",
            title: "P512",
            website: "P856"
        }
        this.directLink = this.directLink.bind(this)
        this.getPreviewUrl = this.getPreviewUrl.bind(this)
    }

    async fetchServices() {
        const result = await fetch(this.url)
        const indexPage = await result.json()

        this.preview = indexPage["preview"]
        this.suggestUrls = {
            entity: indexPage["suggest"]["entity"]["services_url"],
            property: indexPage["suggest"]["property"]["services_url"]
        }
        this.view = indexPage["view"]["url"]
    }

    directLink(id) {
        return this.view?.replace("{{id}}", id)
    }

    getPreviewUrl(id) {
        if (!this.preview) {
            return
        }

        // https://wikidata.reconci.link/en/preview?id={{id}}
        
        return this.preview["url"].replace("{{id}}", id) //const result =  await fetch(this.previewUrl.replace("{{id}}", id))
        //const text = await result.text()
        //console.log("TÖXT", text)
        //return text
    }

    async fetchReconciled(entities) {
        //const result = await fetch(url)
        const queries = entities.map(entity => this.createQuery(entity, "Q5", this.mapping))
        const batches = this.create_batch_queries(queries)
        const results = []

        for (let idx in batches) {
            const result = await this.fetch1Batch(batches[idx])
            console.log("ORDERED RECONCILITATION:", result)
            results.push(...result)
        }

        console.log("RECONCILIATION RESULT:", results)
        return results
    }

    async fetch1Batch(batch) {

        const result = await fetch(this.url, {
            method: "POST",
            body: new URLSearchParams({
                queries: JSON.stringify(batch)
            })
        })
        const reconciled = await result.json()

        // API returns map with keys "q0", "q1",... somehow we need to sort them before putting the results into an array.
        const ordered = Object.keys(reconciled).map(key =>
            Number(key.substr(1))).sort((a, b) => a - b).map(key => reconciled["q" + key])
        return ordered
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