export const contractSchema = {
  "required": [
      "id",
      "display",
      "input"
  ],
  "properties": {
      "id": {
          "$id": "#/properties/id",
          "type": "string"
      },
      "display": {
          "required": [
              "id",
              "locale",
              "contract",
              "card",
              "consent",
              "claims"
          ],
          "properties": {
              "id": {
                  "$id": "#/properties/display/properties/id",
                  "type": "string"
              },
              "locale": {
                  "$id": "#/properties/display/properties/locale",
                  "type": "string"
              },
              "contract": {
                  "$id": "#/properties/display/properties/contract",
                  "type": "string"
              },
              "card": {
                  "required": [
                      "title",
                      "issuedBy",
                      "backgroundColor",
                      "textColor",
                      "logo",
                      "description"
                  ],
                  "properties": {
                      "title": {
                          "$id": "#/properties/display/properties/card/properties/title",
                          "type": "string"
                      },
                      "issuedBy": {
                          "$id": "#/properties/display/properties/card/properties/issuedBy",
                          "type": "string"
                      },
                      "backgroundColor": {
                          "$id": "#/properties/display/properties/card/properties/backgroundColor",
                          "type": "string"
                      },
                      "textColor": {
                          "$id": "#/properties/display/properties/card/properties/textColor",
                          "type": "string"
                      },
                      "logo": {
                          "required": [
                              "uri"
                          ],
                          "properties": {
                              "uri": {
                                  "$id": "#/properties/display/properties/card/properties/logo/properties/uri",
                                  "type": "string"
                              },
                              "description": {
                                  "$id": "#/properties/display/properties/card/properties/logo/properties/description",
                                  "type": "string"
                              }
                          },
                          "$id": "#/properties/display/properties/card/properties/logo",
                          "type": "object"
                      },
                      "description": {
                          "$id": "#/properties/display/properties/card/properties/description",
                          "type": "string"
                      }
                  },
                  "$id": "#/properties/display/properties/card",
                  "type": "object"
              },
              "consent": {
                  "required": [
                      "title",
                      "instructions"
                  ],
                  "properties": {
                      "title": {
                          "$id": "#/properties/display/properties/consent/properties/title",
                          "type": "string"
                      },
                      "instructions": {
                          "$id": "#/properties/display/properties/consent/properties/instructions",
                          "type": "string"
                      }
                  },
                  "$id": "#/properties/display/properties/consent",
                  "type": "object"
              }
          },
          "$id": "#/properties/display",
          "type": "object"
      },
      "input": {
          "required": [
              "id",
              "credentialIssuer",
              "issuer",
              "attestations"
          ],
          "properties": {
              "id": {
                  "$id": "#/properties/input/properties/id",
                  "type": "string"
              },
              "credentialIssuer": {
                  "$id": "#/properties/input/properties/credentialIssuer",
                  "type": "string"
              },
              "issuer": {
                  "$id": "#/properties/input/properties/issuer",
                  "type": "string"
              },
              "attestations": {
                  "properties": {
                      "idTokens": {
                          "items": {
                              "required": [
                                  "encrypted",
                                  "claims",
                                  "required",
                                  "configuration",
                                  "client_id",
                                  "redirect_uri"
                              ],
                              "properties": {
                                  "encrypted": {
                                      "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/encrypted",
                                      "type": "boolean"
                                  },
                                  "claims": {
                                      "items": {
                                          "required": [
                                              "claim",
                                              "required",
                                              "indexed"
                                          ],
                                          "properties": {
                                              "claim": {
                                                  "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/claims/items/properties/claim",
                                                  "type": "string"
                                              },
                                              "required": {
                                                  "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/claims/items/properties/required",
                                                  "type": "boolean"
                                              },
                                              "indexed": {
                                                  "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/claims/items/properties/indexed",
                                                  "type": "boolean"
                                              }
                                          },
                                          "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/claims/items",
                                          "type": "object"
                                      },
                                      "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/claims",
                                      "type": "array"
                                  },
                                  "required": {
                                      "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/required",
                                      "type": "boolean"
                                  },
                                  "configuration": {
                                      "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/configuration",
                                      "type": "string"
                                  },
                                  "client_id": {
                                      "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/client_id",
                                      "type": "string"
                                  },
                                  "redirect_uri": {
                                      "$id": "#/properties/input/properties/attestations/properties/idTokens/items/properties/redirect_uri",
                                      "type": "string"
                                  }
                              },
                              "$id": "#/properties/input/properties/attestations/properties/idTokens/items",
                              "type": "object"
                          },
                          "$id": "#/properties/input/properties/attestations/properties/idTokens",
                          "type": "array"
                      }
                  },
                  "$id": "#/properties/input/properties/attestations",
                  "type": "object"
              }
          },
          "$id": "#/properties/input",
          "type": "object"
      }
  },
  "$id": "http://example.org/root.json#",
  "type": "object",
  "definitions": {},
  "$schema": "http://json-schema.org/draft-07/schema#"
}