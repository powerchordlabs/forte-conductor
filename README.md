# forte-conductor

TODO: build this readme  
TODO: migrate existing codebase to this repo

### original notes

CONDUCTOR (powerchordinc/conductor)
* add ConductorContainer component
    * props:
        * apiClient: // an instance of the api package
        * onFetched: composedData => {} // optional
        * onFailure: requestError => {} // optional
* utilize ‘api’ package i.e. api.composite()
* add .Cache property to query
* create cache manager (add, invalidate…)
* server-side removes queries for non-public resources e.g: orders…
* cache key includes canonicalAddress
* track errors via ‘api’ package, 
    * i.e. api.log.error(msg, e)
* look into removal of ‘queryResults’ prop in favor of just returning props as specified in static.query
* look into memcache, redis, groupcache as providers

### query example:
```
{
  "screen": {
    "tenant": {
      "_resourceDefined": true,
      "_resource": "tenants",
      "_paramsRequested": true,
      "_params": {
        "activeContext": true
      },
      "_singular": true
    },
    "storeNewsContent": {
      "_resourceDefined": true,
      "_resource": "content",
      "_paramsRequested": true,
      "_params": {
        "key": "cmssn"
      },
      "_singular": true
    },
    "fma": {
      "_resourceDefined": true,
      "_resource": "content-fma",
      "_paramsRequested": false,
      "_params": {
        
      },
      "_singular": false
    },
    "featuredProducts": {
      "_resourceDefined": true,
      "_resource": "products",
      "_paramsRequested": true,
      "_params": {
        "featured": true
      },
      "_singular": false
    }
  },
  "layout": {
    "footer": {
      "primaryLocation": {
        "_resourceDefined": true,
        "_resource": "locations",
        "_paramsRequested": true,
        "_params": {
          "isPrimary": true
        },
        "_singular": true
      },
      "news": {
        "_resourceDefined": true,
        "_resource": "content",
        "_paramsRequested": true,
        "_params": {
          "key": "cmhp"
        },
        "_singular": true
      },
      "newsletter": {
        "_resourceDefined": true,
        "_resource": "content",
        "_paramsRequested": true,
        "_params": {
          "key": "cmnl"
        },
        "_singular": true
      }
    },
    "header": {
      "primaryNavigation": {
        "locations": {
          "_resourceDefined": true,
          "_resource": "locations",
          "_paramsRequested": false,
          "_params": {
            
          },
          "_singular": false
        },
        "productCategoryList": {
          "_resourceDefined": true,
          "_resource": "product-categories",
          "_paramsRequested": false,
          "_params": {
            
          },
          "_singular": false
        }
      },
      "tenant": {
        "_resourceDefined": true,
        "_resource": "tenants",
        "_paramsRequested": true,
        "_params": {
          "activeContext": true
        },
        "_singular": true
      }
    }
  }
}
```

### composite example:

```
{
  "composition": {
    "tenants": [
      {
        "plan": {
          "params": {
            "activeContext": true
          },
          "singular": true
        },
        "conduit": [
          [
            "screen",
            "tenant"
          ],
          [
            "layout",
            "header",
            "tenant"
          ]
        ]
      }
    ],
    "content": [
      {
        "plan": {
          "params": {
            "key": "cmssn"
          },
          "singular": true
        },
        "conduit": [
          [
            "screen",
            "storeNewsContent"
          ]
        ]
      },
      {
        "plan": {
          "params": {
            "key": "cmhp"
          },
          "singular": true
        },
        "conduit": [
          [
            "layout",
            "footer",
            "news"
          ]
        ]
      },
      {
        "plan": {
          "params": {
            "key": "cmnl"
          },
          "singular": true
        },
        "conduit": [
          [
            "layout",
            "footer",
            "newsletter"
          ]
        ]
      }
    ],
    "content-fma": [
      {
        "plan": {
          "params": {
            
          },
          "singular": false
        },
        "conduit": [
          [
            "screen",
            "fma"
          ]
        ]
      }
    ],
    "products": [
      {
        "plan": {
          "params": {
            "featured": true
          },
          "singular": false
        },
        "conduit": [
          [
            "screen",
            "featuredProducts"
          ]
        ]
      }
    ],
    "locations": [
      {
        "plan": {
          "params": {
            "isPrimary": true
          },
          "singular": true
        },
        "conduit": [
          [
            "layout",
            "footer",
            "primaryLocation"
          ]
        ]
      },
      {
        "plan": {
          "params": {
            
          },
          "singular": false
        },
        "conduit": [
          [
            "layout",
            "header",
            "primaryNavigation",
            "locations"
          ]
        ]
      }
    ],
    "product-categories": [
      {
        "plan": {
          "params": {
            
          },
          "singular": false
        },
        "conduit": [
          [
            "layout",
            "header",
            "primaryNavigation",
            "productCategoryList"
          ]
        ]
      }
    ]
  },
  "request": {
    "tenants": [
      {
        "params": {
          "activeContext": true
        },
        "singular": true
      }
    ],
    "content": [
      {
        "params": {
          "key": "cmssn"
        },
        "singular": true
      },
      {
        "params": {
          "key": "cmhp"
        },
        "singular": true
      },
      {
        "params": {
          "key": "cmnl"
        },
        "singular": true
      }
    ],
    "content-fma": [
      {
        "params": {
          
        },
        "singular": false
      }
    ],
    "products": [
      {
        "params": {
          "featured": true
        },
        "singular": false
      }
    ],
    "locations": [
      {
        "params": {
          "isPrimary": true
        },
        "singular": true
      },
      {
        "params": {
          
        },
        "singular": false
      }
    ],
    "product-categories": [
      {
        "params": {
          
        },
        "singular": false
      }
    ]
  }
}
```