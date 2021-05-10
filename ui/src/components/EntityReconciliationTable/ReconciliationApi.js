


class ReconciliationApi {
    constructor(url, idProperty, type, propMapping) {
        this.url = url
        this.idProperty = idProperty // e.g. wikidataId in FtM schema
        this.isInit = false
        this.type = type

        this.propMapping = propMapping

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
        this.isInit = true
    }

    directLink(id) {
        return this.view?.replace("{{id}}", id)
    }

    getPreviewUrl(id) {
        if (!this.isInit) {
            console.log("PREVIEW ACCESSES BEFORE INITIALIZATION")
            return
        }
        return this.preview["url"].replace("{{id}}", id)
    }

    async fetchReconciled(entities) {
        const queries = entities.map(entity => this.createQuery(entity, this.type, this.propMapping))
        const batches = this.create_batch_queries(queries)
        const results = []

        for (let idx in batches) {
            const result = await this.fetch1Batch(batches[idx])
            results.push(...result)
        }

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
        console.log(reconciled)
        // API returns map with keys "q0", "q1",... for some reason we need to sort them before putting the results into an array.
        const ordered = Object.keys(reconciled)
            .filter(key => key.match("q\d*"))
            .map(key => Number(key.substr(1)))
            .sort((a, b) => a - b).map(key => reconciled["q" + key])

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
        let start, end, i

        const batches = []
        const max = Math.ceil(queries.length / batch_size)

        for (start = 0, end = batch_size, i = 0;
            i < max;
            i++, start += batch_size, end += batch_size) {
            const batch_query = {}
            queries.slice(start, end).forEach((query, idx) => {
                batch_query["q" + idx] = query
            })
            batches.push(batch_query)
        }

        return batches
    }
}

export default ReconciliationApi;