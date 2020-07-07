import Ajv from "ajv"
import { contractSchema } from './ContractSchema'
import { PortableIdentityCardError } from "../error-handling/PortableIdentityCardError";
import { ErrorConstants } from "../error-handling/ErrorConstants";

/**
 * Class used to Validate Contracts based on Contract Schema.
 */
export class ContractValidator {

  private ajv = new Ajv()

  /**
   * Validate contract using Contract Schema.
   * @param contract Contract to be validated.
   */
  public validate(contract: any) {
    const isValid = this.ajv.validate(contractSchema, contract)
    if (!isValid) {
      const errorMessages = this.ajv.errorsText()
      throw new PortableIdentityCardError(ErrorConstants.INVALID_CONTRACT, `Contract is not valid with error message: ${errorMessages}`, 404);
    }
    return contract
  }
}