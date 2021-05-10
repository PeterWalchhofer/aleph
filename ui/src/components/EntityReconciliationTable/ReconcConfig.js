// Hardcoded configs for reconciliation services.
export const reconcConfig = {
  services: {
    wikidata: {
      url: "https://wikidata.reconci.link/en/api",
      idProperty: "wikidataId",
      mapping: {
        propMapping: {
          Person: {
            title: "P512",
            firstName: "P735",
            lastName: "P734",
            birthDate: "P569",
            birthPlace: "P19",
            deathDate: "P570",
            nationality: "P27",
            gender: "P21",
            ethnicity: "P172",
            religion: "P140"
          },
          Thing: {
            adress: "P6375",
          },
          LegalEntity: {
            email: "P968",
            phone: "P1329",
            website: "P856",
            legalForm: "P1454",
            incorporationDate: "P571",
            dissolutionDate: "P576",
            sector: "P452",
            vatCode: "P3608",
            jurisdiction: "P1001",
            mainCountry: "P495",
            okpoCode: "P2391",
            dunsCode: "P2771",
            swiftBic: "P2627",
            parent: "P749"
          },
          Company: {
            irsCode: "P1297",
            clkCode: "P5531",
            okvedCode: "P3246"
          }
        },
        typeMapping: {
          Thing: "Q35120",
          Person: "Q5",
          Organization: "Q43229",
          LegalEntity: "Q3778211",
          Company: "Q783794",
          PublicBody: "Q2659904"
        },
      },
    },
    openCorporates: {
      url: "https://opencorporates.com/reconcile",
      idProperty: "opencorporatesUrl",
      mapping: {
        typeMapping: {
          Organization: "Organization",
          Company: "Organization",
          LegalEntity: "Organization",
        },
        propMapping: {
          Country: "jurisdiction_code",
          incorporationDate: "date"
        }
      },
    },
  },
  defaultRecService: "wikidata"
}

export class PropertyMapper {

  constructor(config, service = "wikidata") {
    this.svc_name = service
    this.config = config
    this.svc_config = config.services[service];
    this.propMapping = this.svc_config["mapping"]["propMapping"]
    this.typeMapping = this.svc_config["mapping"]["typeMapping"]
    this.url = this.svc_config["url"]
    this.idProperty = this.svc_config["idProperty"]
  }

  getPropertyMapping(schemata) {
    // A Person object is also a "Thing", a "LegalEntity",..
    return schemata.reduce((acc, schema) => {
      const props = this.propMapping[schema]
      return props ? { ...acc, ...props } : { ...acc }
    }, {})
  }

  getTypeMapping(schema) {
    return this.typeMapping[schema]
  }

  getAllServices() {
    return Object.keys(this.config.services).map(key => {
      return {
        name: key,
        supportedTypes: Object.keys(this.config.services[key].mapping.typeMapping)
      }
    });
  }
}
export default reconcConfig